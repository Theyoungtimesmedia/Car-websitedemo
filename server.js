// File: server.js - NEKpay Payment Gateway Integration (FIXED)
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  TEST_MODE: false, // IMPORTANT: Set to false ONLY when you have real NEKpay credentials
  
  NEKPAY_MERCHANT_ID: process.env.NEKPAY_MERCHANT_ID || '300567123',
  NEKPAY_API_KEY: process.env.NEKPAY_API_KEY || 'ag278KNH!@',
  NEKPAY_SECRET_KEY: process.env.NEKPAY_SECRET_KEY || '7d6d92745ebc4a3882bd3e854a15254a',
  
  // FIXED: Correct NEKpay URLs
  NEKPAY_BASE_URL: process.env.NEKPAY_BASE_URL || 'https://api.nekpayment.com',
  NEKPAY_CREATE_ORDER_ENDPOINT: '/pay/web',
  NEKPAY_QUERY_ORDER_ENDPOINT: '/query/order',
  NEKPAY_TRANSFER_ENDPOINT: '/pay/transfer',
  NEKPAY_QUERY_TRANSFER_ENDPOINT: '/query/transfer',
  NEKPAY_QUERY_BALANCE_ENDPOINT: '/query/balance',
  
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateSignature(params, secretKey) {
  try {
    // Remove sign field if present
    const signParams = { ...params };
    delete signParams.sign;
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(signParams).sort();
    
    // Create sign string: key1=value1&key2=value2&key=secretKey
    const signStr = sortedKeys
      .map(key => `${key}=${signParams[key]}`)
      .join('&') + `&key=${secretKey}`;
    
    // Generate MD5 hash and convert to uppercase
    const signature = crypto
      .createHash('md5')
      .update(signStr)
      .digest('hex')
      .toUpperCase();
    
    return signature;
  } catch (error) {
    console.error('Signature generation error:', error);
    return '';
  }
}

function verifySignature(params, receivedSignature, secretKey) {
  try {
    const calculatedSignature = generateSignature(params, secretKey);
    return calculatedSignature === receivedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function nekpayRequest(endpoint, data) {
  try {
    const url = `${CONFIG.NEKPAY_BASE_URL}${endpoint}`;
    
    // Prepare request data with required fields
    const requestData = {
      ...data,
      mchId: CONFIG.NEKPAY_MERCHANT_ID,
      timestamp: Date.now().toString(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    // Generate signature
    requestData.sign = generateSignature(requestData, CONFIG.NEKPAY_SECRET_KEY);
    
    console.log('NEKpay Request:', { 
      url, 
      data: { 
        ...requestData, 
        sign: requestData.sign.substring(0, 8) + '...' 
      } 
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.NEKPAY_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });
    
    const responseText = await response.text();
    console.log('NEKpay Raw Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`NEKpay API returned ${response.status}: ${response.statusText} - ${responseText}`);
    }
    
    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    console.log('NEKpay Parsed Response:', result);
    
    return result;
  } catch (error) {
    console.error('NEKpay Request Error:', error);
    throw error;
  }
}

// ============================================
// TEST MODE SIMULATOR
// ============================================
const testOrdersDB = new Map();

function simulateNEKpayResponse(type, data) {
  try {
    if (type === 'create') {
      const order = {
        mchOrderNo: data.mchOrderNo,
        payOrderId: `NEK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        state: 0,
        amount: data.amount,
        currency: data.currency,
        createTime: new Date().toISOString()
      };
      
      testOrdersDB.set(data.mchOrderNo, order);
      
      return {
        code: 0,
        msg: 'success',
        data: {
          ...order,
          payUrl: `${CONFIG.SERVER_URL}/fake-payment?order=${data.mchOrderNo}&amount=${data.amount}`
        }
      };
    }
    
    if (type === 'query') {
      const order = testOrdersDB.get(data.mchOrderNo);
      if (!order) {
        return { code: -1, msg: 'Order not found' };
      }
      
      // Auto-mark as success after 10 seconds
      const orderAge = Date.now() - new Date(order.createTime).getTime();
      if (orderAge > 10000) {
        order.state = 2; // Mark as successful
      }
      
      return {
        code: 0,
        msg: 'success',
        data: order
      };
    }
    
    return { code: -1, msg: 'Invalid request' };
  } catch (error) {
    console.error('Simulator error:', error);
    return { code: -1, msg: error.message };
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// Create payment order
app.post('/api/nekpay/create-payment', async (req, res) => {
  try {
    const { orderNo, amount, currency = 'USD', subject, body, userEmail, userName, planId } = req.body;
    
    // Validation
    if (!orderNo || !amount || !userEmail) {
      return res.status(400).json({
        code: -1,
        msg: 'Missing required fields: orderNo, amount, userEmail'
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Creating Payment Order');
    console.log('Order No:', orderNo);
    console.log('Amount:', amount, currency);
    console.log('User:', userName, '-', userEmail);
    console.log('Plan ID:', planId);
    
    // TEST MODE
    if (CONFIG.TEST_MODE) {
      console.log('🧪 TEST MODE: Simulating payment');
      const result = simulateNEKpayResponse('create', { 
        mchOrderNo: orderNo, 
        amount, 
        currency, 
        subject, 
        body 
      });
      console.log('✅ Test order created');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return res.json(result);
    }
    
    // LIVE MODE
    console.log('🚀 LIVE MODE: Creating real payment');
    
    // Check if credentials are configured
    if (CONFIG.NEKPAY_MERCHANT_ID === '300567123' && CONFIG.NEKPAY_API_KEY === 'ag278KNH!@') {
      console.log('⚠️  WARNING: Using default test credentials!');
      console.log('   Replace with your real NEKpay credentials in production.');
    }
    
    // Prepare NEKpay request data
    const nekpayData = {
      mchOrderNo: orderNo,
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: currency,
      subject: subject || 'Investment Plan',
      body: body || `Payment for ${subject || 'Investment Plan'}`,
      notifyUrl: `${CONFIG.SERVER_URL}/api/nekpay/notify`,
      returnUrl: `${CONFIG.FRONTEND_URL}/payment-success`,
      // Optional fields (if supported by NEKpay)
      email: userEmail,
      userName: userName
    };
    
    const result = await nekpayRequest(CONFIG.NEKPAY_CREATE_ORDER_ENDPOINT, nekpayData);
    
    console.log('✅ NEKpay order created');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Create payment error:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      code: -1,
      msg: error.message || 'Payment creation failed',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Query order status
app.post('/api/nekpay/query-order', async (req, res) => {
  try {
    const { mchOrderNo, payOrderId } = req.body;
    
    if (!mchOrderNo && !payOrderId) {
      return res.status(400).json({ 
        code: -1, 
        msg: 'Missing mchOrderNo or payOrderId' 
      });
    }
    
    console.log(`🔍 Querying order: ${mchOrderNo || payOrderId}`);
    
    // TEST MODE
    if (CONFIG.TEST_MODE) {
      const result = simulateNEKpayResponse('query', { mchOrderNo });
      console.log('   Status:', result.data?.state === 2 ? '✅ Success' : '⏳ Pending');
      return res.json(result);
    }
    
    // LIVE MODE
    const queryData = {};
    if (mchOrderNo) queryData.mchOrderNo = mchOrderNo;
    if (payOrderId) queryData.payOrderId = payOrderId;
    
    const result = await nekpayRequest(CONFIG.NEKPAY_QUERY_ORDER_ENDPOINT, queryData);
    console.log('   Status:', result.data?.state === 2 ? '✅ Success' : '⏳ Pending');
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Query order error:', error);
    res.status(500).json({ 
      code: -1, 
      msg: error.message || 'Query failed',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Payment notification callback
app.post('/api/nekpay/notify', async (req, res) => {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 Payment Notification Received');
    console.log('Data:', req.body);
    
    if (CONFIG.TEST_MODE) {
      console.log('🧪 TEST MODE: Auto-approving notification');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return res.send('SUCCESS');
    }
    
    const { sign, ...params } = req.body;
    
    // Verify signature
    if (!verifySignature(params, sign, CONFIG.NEKPAY_SECRET_KEY)) {
      console.log('❌ Invalid signature');
      console.log('   Expected:', generateSignature(params, CONFIG.NEKPAY_SECRET_KEY));
      console.log('   Received:', sign);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return res.status(400).send('FAIL');
    }
    
    const { mchOrderNo, state, amount, currency, payOrderId } = params;
    
    if (state === 2) {
      console.log('✅ Payment successful');
      console.log('   Order:', mchOrderNo);
      console.log('   Pay Order ID:', payOrderId);
      console.log('   Amount:', amount, currency);
      
      // TODO: Update your database here
      // Example:
      // await db.orders.update({ orderNo: mchOrderNo }, { 
      //   status: 'paid',
      //   payOrderId: payOrderId,
      //   paidAt: new Date()
      // });
      // await db.investments.create({ userId, planId, amount });
      // await sendConfirmationEmail(userEmail, orderDetails);
      
      console.log('⚠️  TODO: Implement database update logic');
    } else {
      console.log('⏳ Payment pending or failed');
      console.log('   State:', state);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // NEKpay expects 'SUCCESS' response
    res.send('SUCCESS');
    
  } catch (error) {
    console.error('❌ Notification error:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    res.status(500).send('FAIL');
  }
});

// Fake payment page (TEST MODE only)
app.get('/fake-payment', (req, res) => {
  const { order, amount } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEKpay Test Payment</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .container {
          background: white;
          padding: 50px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
          width: 100%;
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .logo { font-size: 48px; margin-bottom: 10px; }
        h1 { color: #667eea; margin-bottom: 10px; font-size: 28px; }
        .test-badge {
          display: inline-block;
          background: #fbbf24;
          color: #78350f;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 30px;
        }
        .amount {
          font-size: 56px;
          font-weight: bold;
          color: #1f2937;
          margin: 30px 0;
        }
        .order-info {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 10px;
          margin: 30px 0;
        }
        .order-label { color: #6b7280; font-size: 14px; margin-bottom: 5px; }
        .order-value { color: #1f2937; font-size: 16px; font-family: monospace; word-break: break-all; }
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 18px 50px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          width: 100%;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
        button:active { transform: translateY(0); }
        .note {
          margin-top: 30px;
          padding: 20px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 5px;
          font-size: 14px;
          color: #78350f;
          text-align: left;
        }
        .note strong { display: block; margin-bottom: 10px; font-size: 16px; }
        .note ul { margin-left: 20px; margin-top: 10px; }
        .note li { margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🧪</div>
        <h1>NEKpay Test Payment</h1>
        <div class="test-badge">TEST MODE</div>
        
        <div class="amount">$${amount}</div>
        
        <div class="order-info">
          <div class="order-label">Order ID</div>
          <div class="order-value">${order}</div>
        </div>
        
        <button onclick="completePayment()">✓ Complete Test Payment</button>
        
        <div class="note">
          <strong>⚠️ Test Mode Information</strong>
          <ul>
            <li>This is a simulated payment environment</li>
            <li>No real money will be processed</li>
            <li>Payment status updates automatically after 10 seconds</li>
            <li>You can close this window after clicking the button</li>
          </ul>
        </div>
      </div>
      
      <script>
        function completePayment() {
          alert('✅ Test Payment Completed!\\n\\nOrder ID: ${order}\\n\\nYou can now close this window.\\nThe payment will be marked as successful in 10 seconds.');
          window.close();
        }
      </script>
    </body>
    </html>
  `);
});

// Query balance (optional)
app.post('/api/nekpay/query-balance', async (req, res) => {
  try {
    if (CONFIG.TEST_MODE) {
      return res.json({
        code: 0,
        msg: 'success',
        data: { balance: 1000000, currency: 'USD' }
      });
    }
    
    const result = await nekpayRequest(CONFIG.NEKPAY_QUERY_BALANCE_ENDPOINT, {});
    res.json(result);
    
  } catch (error) {
    console.error('❌ Query balance error:', error);
    res.status(500).json({ code: -1, msg: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    mode: CONFIG.TEST_MODE ? 'test' : 'live',
    baseUrl: CONFIG.NEKPAY_BASE_URL,
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    status: CONFIG.TEST_MODE ? '🧪 TEST MODE' : '🚀 PRODUCTION MODE',
    baseUrl: CONFIG.NEKPAY_BASE_URL,
    endpoints: {
      createOrder: CONFIG.NEKPAY_CREATE_ORDER_ENDPOINT,
      queryOrder: CONFIG.NEKPAY_QUERY_ORDER_ENDPOINT
    },
    timestamp: new Date().toISOString(),
    message: CONFIG.TEST_MODE ? 'Using simulated payments' : 'Using real NEKpay',
    configured: CONFIG.NEKPAY_MERCHANT_ID !== 'YOUR_MERCHANT_ID'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    code: -1,
    msg: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.clear();
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║   ${CONFIG.TEST_MODE ? '🧪 TEST MODE' : '🚀 LIVE MODE'} - NEKpay Backend Server            ║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 Server URL:    http://localhost:${PORT}`);
  console.log(`🌐 NEKpay URL:    ${CONFIG.NEKPAY_BASE_URL}`);
  console.log(`✅ Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test\n`);
  
  if (CONFIG.TEST_MODE) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  TEST MODE IS ACTIVE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ✓ Payments will be simulated');
    console.log('   ✓ No real money will be processed');
    console.log('   ✓ Orders auto-complete after 10 seconds');
    console.log('   ✓ Perfect for testing your frontend\n');
    console.log('💡 To enable LIVE mode: Set TEST_MODE = false in line 14\n');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 LIVE MODE - REAL PAYMENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (CONFIG.NEKPAY_MERCHANT_ID === '300567123') {
      console.log('⚠️  WARNING: Using default test credentials!');
      console.log('   Update these for production:');
      console.log('   - NEKPAY_MERCHANT_ID');
      console.log('   - NEKPAY_API_KEY');
      console.log('   - NEKPAY_SECRET_KEY\n');
    } else {
      console.log('✓ NEKpay credentials configured');
      console.log('✓ Ready to process real payments\n');
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Server started successfully. Waiting for requests...\n');
});