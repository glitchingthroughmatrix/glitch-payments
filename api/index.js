const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: 'rzp_live_RP5EQelgnPuwiH',
  key_secret: 'O4cpPH86H9BecP47Cm0O4ZAu',
});

// Enhanced JSON dictionary for courses with images and descriptions
const coursesDictionary = {
  'glitch_the_matrix': {
    name: 'Full Vault Access',
    price: 199, // in INR
    downloadLink: 'https://drive.google.com/uc?export=download&id=1c-derRuqDkC89cW5kTCp8ujFO1zc3Nsw',
    image: 'https://github.com/glitchingthroughmatrix/image-hosting/blob/main/Break%20the%20matrix%20thumbnail%20on%20website.png?raw=true',
    description: 'Complete access to all premium courses including financial strategies, investment techniques, and business development resources.',
    readMoreLink: 'google.com'
  },
  'andrew_tate': {
    name: 'Andrew Tate Courses',
    price: 79,
    downloadLink: 'https://drive.google.com/uc?export=download&id=149LFArfYaOsqSJHYxsghVC3kSIhpQVyH',
    image: 'https://github.com/glitchingthroughmatrix/image-hosting/blob/main/Andrew%20tate%20all%20course.png?raw=true',
    description: 'Learn from Andrew Tate\'s proven strategies for wealth creation, business mastery, and personal development.',
    readMoreLink: 'google.com'
  },
  'luke_belmar': {
    name: 'Luke Belmar Courses',
    price: 79,
    downloadLink: 'https://drive.google.com/uc?export=download&id=1YQzTFUm_ud5qOzLYwqaGzSd5heAW_RqY',
    image: 'https://github.com/glitchingthroughmatrix/image-hosting/blob/main/Luke%20Belmar.png?raw=true',
    description: 'Master digital entrepreneurship and online business strategies with Luke Belmar\'s cutting-edge methodologies.',
    readMoreLink: 'google.com'
  },
  'iman_gadzhi': {
    name: 'Iman Gadzhi Courses',
    price: 79,
    downloadLink: 'https://drive.google.com/uc?export=download&id=1lUoOdmzG6Oqzz6qRrqkIuldz1V01wpK3',
    image: 'https://github.com/glitchingthroughmatrix/image-hosting/blob/main/Iman%20Gadzhi.png?raw=true',
    description: 'Build successful agencies and scale your business using Iman Gadzhi\'s proven marketing frameworks.',
    readMoreLink: 'google.com'
  },
  // Add more courses here as needed
};

// Function to read data from JSON file
const readData = () => {
  if (fs.existsSync('orders.json')) {
    const data = fs.readFileSync('orders.json');
    return JSON.parse(data);
  }
  return [];
};

// Function to write data to JSON file
const writeData = (data) => {
  fs.writeFileSync('orders.json', JSON.stringify(data, null, 2));
};

// Initialize orders.json if it doesn't exist
if (!fs.existsSync('orders.json')) {
  writeData([]);
}

// Route to get available notes (for dropdown)
app.get('/get-notes', (req, res) => {
  const courseList = Object.keys(coursesDictionary).map(key => ({
    id: key,
    name: coursesDictionary[key].name,
    price: coursesDictionary[key].price,
    image: coursesDictionary[key].image,
    description: coursesDictionary[key].description,
    readMoreLink: coursesDictionary[key].readMoreLink
  }));
  res.json(courseList);
});

// NEW: Route to get course details for carousel (with images and descriptions)
app.get('/get-courses', (req, res) => {
  const courseList = Object.keys(coursesDictionary).map(key => ({
    id: key,
    name: coursesDictionary[key].name,
    price: coursesDictionary[key].price,
    image: coursesDictionary[key].image,
    description: coursesDictionary[key].description,
    readMoreLink: coursesDictionary[key].readMoreLink
  }));
  res.json(courseList);
});

// NEW: Route to get specific course details by ID
app.get('/get-course/:id', (req, res) => {
  const courseId = req.params.id;
  const course = coursesDictionary[courseId];
  
  if (course) {
    res.json({
      id: courseId,
      name: course.name,
      price: course.price,
      image: course.image,
      description: course.description,
      downloadLink: course.downloadLink,
      readMoreLink: coursesDictionary[key].readMoreLink
    });
  } else {
    res.status(404).json({ error: 'Course not found' });
  }
});

// NEW: Admin route to add new courses (optional - for future expansion)
app.post('/admin/add-course', (req, res) => {
  // Simple authentication check (you might want to implement proper auth)
  const { adminKey, id, name, price, downloadLink, image, description } = req.body;
  
  if (adminKey !== 'YOUR_ADMIN_SECRET_KEY') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!id || !name || !price || !downloadLink) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  coursesDictionary[id] = {
    name,
    price,
    downloadLink,
    image: image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    description: description || 'Premium educational content for personal and professional growth.',
    readMoreLink: readMoreLink
  };
  
  res.json({ success: true, message: 'Course added successfully', course: coursesDictionary[id] });
});

// NEW: Admin route to update existing courses
app.put('/admin/update-course/:id', (req, res) => {
  const { adminKey } = req.body;
  const courseId = req.params.id;
  
  if (adminKey !== 'YOUR_ADMIN_SECRET_KEY') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!coursesDictionary[courseId]) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  const { name, price, downloadLink, image, description } = req.body;
  
  if (name) coursesDictionary[courseId].name = name;
  if (price) coursesDictionary[courseId].price = price;
  if (downloadLink) coursesDictionary[courseId].downloadLink = downloadLink;
  if (image) coursesDictionary[courseId].image = image;
  if (description) coursesDictionary[courseId].description = description;
  
  res.json({ success: true, message: 'Course updated successfully', course: coursesDictionary[courseId] });
});

// Route to handle order creation
app.post('/create-order', async (req, res) => {
  try {
    const { selectedNote: selectedCourse, name, email, contact } = req.body;

    // Validate selected note
    if (!coursesDictionary[selectedCourse]) {
      return res.status(400).json({ error: 'Invalid note selection' });
    }

    const courseDetails = coursesDictionary[selectedCourse];
    const amount = courseDetails.price;

    const options = {
      amount: amount * 100, // Convert amount to paise
      currency: 'INR',
      receipt: `notes_${selectedCourse}_${Date.now()}`,
      notes: {
        product: selectedCourse,
        product_name: courseDetails.name,
        download_link: courseDetails.downloadLink,
        customer_name: name,
        customer_email: email,
        customer_contact: contact,
        venture: 'Glitch'
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Save order to JSON file
    const orders = readData();
    orders.push({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: 'created',
      product: selectedCourse,
      product_name: courseDetails.name,
      download_link: courseDetails.downloadLink,
      customer_name: name,
      customer_email: email,
      customer_contact: contact,
      venture: 'Glitch',
      created_at: new Date().toISOString()
    });
    writeData(orders);

    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
});

// Route to handle payment verification
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const secret = razorpay.key_secret;
  const body = razorpay_order_id + '|' + razorpay_payment_id;

  try {
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    if (isValidSignature) {
      // Update the order with payment details
      const orders = readData();
      const order = orders.find(o => o.order_id === razorpay_order_id);
      if (order) {
        order.status = 'paid';
        order.payment_id = razorpay_payment_id;
        order.paid_at = new Date().toISOString();
        writeData(orders);

        // Return success with download link
        res.status(200).json({ 
          status: 'ok',
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          download_link: order.download_link,
          product_name: order.product_name
        });
        console.log("Payment verification successful for order:", razorpay_order_id);
      } else {
        res.status(404).json({ status: 'error', message: 'Order not found' });
      }
    } else {
      res.status(400).json({ status: 'verification_failed' });
      console.log("Payment verification failed for order:", razorpay_order_id);
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ status: 'error', message: 'Error verifying payment' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});