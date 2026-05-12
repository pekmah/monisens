package com.hauzpay.monisens.sms

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.database.Cursor
import android.os.Build
import android.provider.Telephony
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MonisensSmsModule : Module() {
  private var smsReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("MonisensSms")
    Events(SMS_EVENT_NAME)

    AsyncFunction("readInbox") { limit: Int, sinceTimestamp: Double? ->
      if (!hasPermission(Manifest.permission.READ_SMS)) {
        throw CodedException("sms_permission_denied", "READ_SMS permission is required.", null)
      }

      val messages = mutableListOf<Map<String, Any?>>()
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
          messages.add(it.toSmsMap())
          count += 1
        }
      }

      messages
    }

    AsyncFunction("startListening") {
      if (!hasPermission(Manifest.permission.RECEIVE_SMS)) {
        throw CodedException("sms_permission_denied", "RECEIVE_SMS permission is required.", null)
      }

      if (smsReceiver == null) {
        smsReceiver = object : BroadcastReceiver() {
          override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
              return
            }

            for (message in Telephony.Sms.Intents.getMessagesFromIntent(intent)) {
              sendEvent(
                SMS_EVENT_NAME,
                mapOf(
                  "id" to "incoming:${message.originatingAddress}:${message.timestampMillis}",
                  "sender" to message.originatingAddress.orEmpty(),
                  "body" to message.messageBody.orEmpty(),
                  "receivedAt" to message.timestampMillis.toDouble(),
                  "readAt" to null,
                ),
              )
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
      }

      null
    }

    AsyncFunction("stopListening") {
      unregisterSmsReceiver()
    }

    OnDestroy {
      unregisterSmsReceiver()
    }
  }

  private val reactContext: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(
      reactContext,
      permission,
    ) == PackageManager.PERMISSION_GRANTED
  }

  private fun unregisterSmsReceiver() {
    smsReceiver?.let {
      runCatching {
        reactContext.unregisterReceiver(it)
      }
    }
    smsReceiver = null
  }

  private fun Cursor.toSmsMap(): Map<String, Any?> {
    val id = getString(getColumnIndexOrThrow(Telephony.Sms._ID))
    val sender = getString(getColumnIndexOrThrow(Telephony.Sms.ADDRESS)).orEmpty()
    val body = getString(getColumnIndexOrThrow(Telephony.Sms.BODY)).orEmpty()
    val receivedAt = getLong(getColumnIndexOrThrow(Telephony.Sms.DATE))
    val read = getInt(getColumnIndexOrThrow(Telephony.Sms.READ))

    return mapOf(
      "id" to id,
      "sender" to sender,
      "body" to body,
      "receivedAt" to receivedAt.toDouble(),
      "readAt" to if (read == 1) receivedAt.toDouble() else null,
    )
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
