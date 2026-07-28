import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for all routes so the frontend static site can query the backend worker
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Root verification route
app.get('/', (c) => {
  return c.text('Bizzap Client Full-Stack Worker API Running!')
})

// 1. Submit Contact Form
app.post('/api/contact', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, message } = body

    if (!name || !phone) {
      return c.json({ error: 'Name and Phone are required fields.' }, 400)
    }

    // Insert into D1 Database
    const { success } = await c.env.DB.prepare(
      `INSERT INTO contact_submissions (name, email, phone, message) VALUES (?, ?, ?, ?)`
    )
    .bind(name, email || null, phone, message || null)
    .run()

    if (!success) {
      return c.json({ error: 'Database write failed.' }, 500)
    }

    return c.json({ success: true, message: 'Contact submission received successfully.' })
  } catch (err: any) {
    return c.json({ error: err.message || 'Internal server error' }, 500)
  }
})

// 2. Submit Appointment Booking
app.post('/api/book', async (c) => {
  try {
    const body = await c.req.json()
    const { customerName, customerPhone, bookingDate, bookingTime, serviceRequested } = body

    if (!customerName || !customerPhone || !bookingDate || !bookingTime) {
      return c.json({ error: 'Customer name, phone, booking date, and time are required.' }, 400)
    }

    // Insert booking into D1 Database
    const { success } = await c.env.DB.prepare(
      `INSERT INTO bookings (customer_name, customer_phone, booking_date, booking_time, service_requested) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(customerName, customerPhone, bookingDate, bookingTime, serviceRequested || null)
    .run()

    if (!success) {
      return c.json({ error: 'Database write failed.' }, 500)
    }

    return c.json({ success: true, message: 'Booking request submitted successfully.' })
  } catch (err: any) {
    return c.json({ error: err.message || 'Internal server error' }, 500)
  }
})

// 3. Retrieve Submissions (Simple API key protection for admin retrieval)
app.get('/api/submissions', async (c) => {
  const authHeader = c.req.header('Authorization')
  // In production, secure this by setting a wrangler secret (e.g. wrangler secret put API_KEY)
  const isAuthorized = authHeader === 'Bizzap-Admin-Secret'

  if (!isAuthorized) {
    return c.json({ error: 'Unauthorized access.' }, 401)
  }

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM contact_submissions ORDER BY created_at DESC`
    ).all()
    return c.json(results)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 4. Retrieve Bookings
app.get('/api/bookings', async (c) => {
  const authHeader = c.req.header('Authorization')
  const isAuthorized = authHeader === 'Bizzap-Admin-Secret'

  if (!isAuthorized) {
    return c.json({ error: 'Unauthorized access.' }, 401)
  }

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM bookings ORDER BY booking_date DESC, booking_time DESC`
    ).all()
    return c.json(results)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
