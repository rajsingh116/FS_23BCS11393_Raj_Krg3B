import { useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8080'

const RAZORPAY_KEY = 'rzp_test_SUtmFpZbeLLdGw'

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load Razorpay'))

    document.body.appendChild(script)
  })
}

export default function CheckoutForm() {
  const [step, setStep] = useState('booking') // 'booking' or 'payment'
  const [appointment, setAppointment] = useState(null)
  
  // Booking form state
  const [patientId, setPatientId] = useState('1')
  const [doctorId, setDoctorId] = useState('1')
  const [date, setDate] = useState('2026-04-10')
  const [doctors, setDoctors] = useState([])
  
  // Payment state
  const [amountInput, setAmountInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
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
      // Stage 1: Create appointment
      const res = await axios.post('/api/appointments/create', {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        date,
      })

      console.log('✅ Appointment created:', res.data)
      setAppointment(res.data)
      setAmountInput((res.data.consultationFee || 0).toString())
      setStep('payment')
    } catch (err) {
      setError(err.response?.data?.error || '❌ Failed to create appointment')
      console.error('Error creating appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const rupees = parseFloat(amountInput)
      let overrideAmount = null

      if (!isNaN(rupees) && rupees > 0) {
        overrideAmount = Math.round(rupees * 100)
      }

      // Stage 2: Create payment order
      const res = await axios.post(
        `/api/payment/${appointment.appointmentId}/create-payment`,
        overrideAmount ? { amount: overrideAmount } : {}
      )

      const { razorpayOrderId, amount, currency, keyId } = res.data
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
            setSuccess('🎉 Payment Successful! Email sent.')
          } catch (err) {
            setError('❌ Verification Failed: ' + (err.response?.data?.error || err.message))
          } finally {
            setLoading(false)
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError('⚠️ Payment Failed: ' + (err.response?.data?.error || err.message))
      console.error('Payment error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        
        {/* Step 1: Booking Form */}
        {step === 'booking' ? (
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              📅 Book Your Appointment
            </h2>

            <div className="space-y-6">
              {/* Patient ID */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Patient ID
                </label>
                <input
                  type="number"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="Enter patient ID"
                />
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Select Doctor
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  <option value="">-- Select a doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.name} - {doc.specialization} (₹{doc.consultationFee || 500})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateAppointment}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Creating Appointment...' : '✅ Create Appointment'}
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Payment Form
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              💳 Payment Details
            </h2>

            {/* Appointment Details */}
            <div className="mb-8 bg-indigo-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Appointment Summary</h3>
              <div className="space-y-3 text-gray-700">
                <p><span className="font-semibold">Doctor:</span> {appointment.doctorName}</p>
                <p><span className="font-semibold">Patient:</span> {appointment.patientName}</p>
                <p><span className="font-semibold">Date:</span> {appointment.appointmentDate}</p>
                <p><span className="font-semibold">Consultation Fee:</span> ₹{appointment.consultationFee}</p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg"
              />
            </div>

            {/* Live Price */}
            <div className="mb-6 p-4 rounded-xl bg-gray-100">
              <p className="text-gray-600">Total Payable</p>
              <p className="text-3xl font-bold text-indigo-600">
                ₹{amountInput || 0}
              </p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 text-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? '⏳ Processing Payment...' : '💳 Pay Now'}
            </button>

            {/* Back Button */}
            <button
              onClick={() => {
                setAppointment(null)
                setStep('booking')
                setError('')
                setSuccess('')
              }}
              className="w-full py-2 bg-gray-300 text-gray-900 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
            >
              ← Back to Booking
            </button>

            {/* Status Messages */}
            {success && (
              <div className="mt-4 text-green-600 font-bold text-center bg-green-100 p-3 rounded-lg animate-bounce">
                {success}
              </div>
            )}
            {error && (
              <div className="mt-4 text-red-600 font-bold text-center bg-red-100 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}