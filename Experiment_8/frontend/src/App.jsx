import { useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8080'

import heroImg from './assets/hero.png'
import './App.css'

const RAZORPAY_KEY = 'rzp_test_SUtmFpZbeLLdGw'

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'))
    document.body.appendChild(script)
  })
}

// Step 1: Appointment Booking Form
function AppointmentForm({ onAppointmentCreated }) {
  const [patientId, setPatientId] = useState('1')
  const [doctorId, setDoctorId] = useState('1')
  const [date, setDate] = useState('2026-04-10')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/doctors')
      setDoctors(res.data)
    } catch (err) {
      console.error('Failed to fetch doctors:', err)
    }
  }

  const handleCreateAppointment = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await axios.post('/api/appointments/create', {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        date,
      })

      console.log('✅ Appointment created:', res.data)
      onAppointmentCreated(res.data)
    } catch (err) {
      setError(err.response?.data?.error || '❌ Failed to create appointment')
      console.error('Error creating appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        📅 Book Your Appointment
      </h2>

      <div className="space-y-4">
        {/* Patient ID */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Patient ID
          </label>
          <input
            type="number"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Enter patient ID"
          />
        </div>

        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Select Doctor
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.name} - {doc.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Appointment Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Error Message */}
        {error && <div className="text-red-600 text-sm">{error}</div>}

        {/* Create Button */}
        <button
          onClick={handleCreateAppointment}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          {loading ? '⏳ Creating...' : '✅ Create Appointment'}
        </button>
      </div>
    </div>
  )
}

// Step 2: Payment Card (shown after appointment created)
function PaymentCard({ appointment, onBack }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [amountInput, setAmountInput] = useState((appointment.consultationFee || 0).toString())

  const handlePay = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const rupees = parseFloat(amountInput)
      let overrideAmount = null

      if (!isNaN(rupees) && rupees > 0) {
        overrideAmount = Math.round(rupees * 100)
      }

      console.log('Creating payment for appointment:', appointment.appointmentId)

      // Stage 2: Create payment order
      const createRes = await axios.post(
        `/api/payment/${appointment.appointmentId}/create-payment`,
        overrideAmount ? { amount: overrideAmount } : {}
      )

      const { razorpayOrderId, amount, currency, keyId } = createRes.data
      console.log('✅ Payment order created:', { razorpayOrderId, amount })

      await loadRazorpayScript()

      const options = {
        key: keyId || RAZORPAY_KEY,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: 'HealthHub',
        description: `Appointment ${appointment.appointmentId}`,
        handler: async function (response) {
          try {
            console.log('Verifying payment...')
            // Stage 4: Verify payment
            await axios.post(`/api/payment/verify-payment`, {
              appointmentId: appointment.appointmentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            })
            setSuccess('🎉 Payment Successful! Email sent to your inbox.')
          } catch (err) {
            setError('❌ Verification Failed: ' + err.response?.data?.error)
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError('⚠️ Payment failed: ' + (err.response?.data?.error || err.message))
      console.error('Payment error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        💳 Payment Details
      </h2>

      {/* Appointment Summary */}
      <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg mb-6 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Doctor:</span> {appointment.doctorName}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Patient:</span> {appointment.patientName}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Date:</span> {appointment.appointmentDate}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Fee:</span> ₹{appointment.consultationFee}
        </p>
      </div>

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Payment Amount (₹)
          </label>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Live Preview */}
        <div className="text-lg font-semibold text-center text-indigo-600">
          💰 You will pay: ₹{amountInput || 0}
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          {loading ? '⏳ Processing...' : '💳 Pay Now'}
        </button>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          ← Back
        </button>

        {/* Status Messages */}
        {success && (
          <div className="text-green-600 font-medium text-center animate-bounce bg-green-50 dark:bg-green-900 p-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="text-red-600 font-medium text-center bg-red-50 dark:bg-red-900 p-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const [appointment, setAppointment] = useState(null)

  const handleAppointmentCreated = (appointmentData) => {
    setAppointment(appointmentData)
  }

  const handleBack = () => {
    setAppointment(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
        🏥 HealthHub Appointment System
      </h1>

      {!appointment ? (
        <AppointmentForm onAppointmentCreated={handleAppointmentCreated} />
      ) : (
        <PaymentCard appointment={appointment} onBack={handleBack} />
      )}
    </div>
  )
}

export default App