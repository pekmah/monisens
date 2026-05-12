package com.hauzpay.monisens.sms

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class MonisensSmsModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private var smsReceiver: BroadcastReceiver? = null

  override fun getName(): String = "MonisensSms"

  @ReactMethod
  fun readInbox(limit: Int, sinceTimestamp: Double?, promise: Promise) {
    if (!hasPermission(Manifest.permission.READ_SMS)) {
      promise.reject("sms_permission_denied", "READ_SMS permission is required.")
      return
    }

    val messages = Arguments.createArray()
    val selectionParts = mutableListOf<String>()
    val selectionArgs = mutableListOf<String>()

    if (sinceTimestamp != null && sinceTimestamp > 0) {
      selectionParts.add("${Telephony.Sms.DATE} >= ?")
      selectionArgs.add(sinceTimestamp.toLong().toString())
    }

    val cursor = reactContext.contentResolver.query(
      Telephony.Sms.Inbox.CONTENT_URI,
      arrayOf(
        Telephony.Sms._ID,
        Telephony.Sms.ADDRESS,
        Telephony.Sms.BODY,
        Telephony.Sms.DATE,
        Telephony.Sms.READ,
      ),
      selectionParts.takeIf { it.isNotEmpty() }?.joinToString(" AND "),
      selectionArgs.takeIf { it.isNotEmpty() }?.toTypedArray(),
      "${Telephony.Sms.DATE} DESC",
    )

    cursor.useRows {
      var count = 0
      while (it.moveToNext() && count < limit.coerceAtLeast(0)) {
        messages.pushMap(it.toSmsMap())
        count += 1
      }
    }

    promise.resolve(messages)
  }

  @ReactMethod
  fun startListening(promise: Promise) {
    if (!hasPermission(Manifest.permission.RECEIVE_SMS)) {
      promise.reject("sms_permission_denied", "RECEIVE_SMS permission is required.")
      return
    }

    if (smsReceiver != null) {
      promise.resolve(null)
      return
    }

    smsReceiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
          return
        }

        for (message in Telephony.Sms.Intents.getMessagesFromIntent(intent)) {
          val payload = Arguments.createMap().apply {
            putString("id", "incoming:${message.originatingAddress}:${message.timestampMillis}")
            putString("sender", message.originatingAddress.orEmpty())
            putString("body", message.messageBody.orEmpty())
            putDouble("receivedAt", message.timestampMillis.toDouble())
            putNull("readAt")
          }
          emitSmsReceived(payload)
        }
      }
    }

    val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactContext.registerReceiver(smsReceiver, filter, Context.RECEIVER_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      reactContext.registerReceiver(smsReceiver, filter)
    }
    promise.resolve(null)
  }

  @ReactMethod
  fun stopListening(promise: Promise) {
    smsReceiver?.let {
      runCatching {
        reactContext.unregisterReceiver(it)
      }
    }
    smsReceiver = null
    promise.resolve(null)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter.
  }

  override fun invalidate() {
    smsReceiver?.let {
      runCatching {
        reactContext.unregisterReceiver(it)
      }
    }
    smsReceiver = null
    super.invalidate()
  }

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(
      reactContext,
      permission,
    ) == PackageManager.PERMISSION_GRANTED
  }

  private fun emitSmsReceived(payload: WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(SMS_EVENT_NAME, payload)
  }

  private fun Cursor.toSmsMap(): WritableMap {
    val id = getString(getColumnIndexOrThrow(Telephony.Sms._ID))
    val sender = getString(getColumnIndexOrThrow(Telephony.Sms.ADDRESS)).orEmpty()
    val body = getString(getColumnIndexOrThrow(Telephony.Sms.BODY)).orEmpty()
    val receivedAt = getLong(getColumnIndexOrThrow(Telephony.Sms.DATE))
    val read = getInt(getColumnIndexOrThrow(Telephony.Sms.READ))

    return Arguments.createMap().apply {
      putString("id", id)
      putString("sender", sender)
      putString("body", body)
      putDouble("receivedAt", receivedAt.toDouble())
      if (read == 1) {
        putDouble("readAt", receivedAt.toDouble())
      } else {
        putNull("readAt")
      }
    }
  }

  private inline fun Cursor?.useRows(block: (Cursor) -> Unit) {
    if (this == null) {
      return
    }

    use(block)
  }

  companion object {
    private const val SMS_EVENT_NAME = "MonisensSmsReceived"
  }
}
