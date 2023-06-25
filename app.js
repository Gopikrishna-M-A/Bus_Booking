const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const Razorpay = require('razorpay');
const bwipjs = require('bwip-js');
require('dotenv').config();



const port = process.env.PORT;
const Pass_Key = process.env.PASS_KEY;
const key_secret = process.env.KEY_SECRET;
const user_id = process.env.USER_ID;


const razorpay = new Razorpay({
  key_id:"rzp_test_EiwXDPM7Unp7ol",
  key_secret,
});
const app = express()

const URL = `mongodb+srv://${user_id}:${encodeURIComponent(Pass_Key)}@cluster0.sbpkrhp.mongodb.net/`;

mongoose.set("strictQuery", false);
mongoose.connect(URL, { useNewUrlParser: true });

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs')  
app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser());
app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true
  }));



// user Collection

const userSchema = mongoose.Schema(
    {
    admNum:String,
    name:String,
    email:String,
    password:String,
    role:String,
    phone:Number,
    }
)
userSchema.set('timestamps', true);

const User = new mongoose.model('User',userSchema)


    
const paymentSchema = mongoose.Schema(
  {
    orderId:String,
    paymentId:String,
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' 
    },
    amount:Number,
    destination:String,
    type:String,
    date:String,
    method:String,
    barcode: {
      type: Buffer,
      required: true
    }
  }
)
paymentSchema.set('timestamps', true);

const Payment = new mongoose.model('Payment',paymentSchema)




const isLoggedIn = (req, res, next) => {
    if (req.cookies.loggedIn === 'true') {
      next();
    } else {
      res.redirect("/login")
    }
}


// **************************************************************** routes ***************************************************************

// route

app.get("/",(req,res)=>{
    res.redirect("/login")
})
app.get("/home",isLoggedIn,(req,res)=>{
    res.render("home")

})

app.post("/book",(req,res)=>{


    var bus = 5
    const {way, destination, date} = req.body


    var price = 0
    if(destination == "Koratty" || destination == "karukutty"  )
      price = 75
    else
      price = 150

    if(destination == "Koratty")
    bus = 7
    else if(destination == "karukutty")
    bus = 10




    const orderOptions = {
      amount: price, // The order amount in paise or the smallest currency unit
      currency: 'INR', // The currency code (e.g., INR for Indian Rupees)
      receipt: 'order_receipt_123', // A unique identifier for the order
      payment_capture: 1, // Capture the payment immediately
    };
    
    razorpay.orders.create(orderOptions, function(err, order) {
      if (err) {
        console.error(err);
        // Handle the error appropriately
      } else {
        const orderId = order.id;
        res.render("payment",{orderId:order.id,bus,price,destination,way,date,name:req.session.user.admNum})
        // Use the orderId for further processing or to pass it to the client-side code
        console.log('Order ID:', orderId);
        // Send the orderId to the client-side to initiate the payment
      }
    });
    



    console.log(way);
    console.log(destination);
   

    console.log(price);
    
})




//logout route

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err)
        console.log(err)
      else {
        res.clearCookie('loggedIn');
        res.redirect('/login');
      }
    });
  });


//login route

app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",(req,res)=>{
    const {admNum, password} =  req.body
    console.log(admNum);
    console.log(password);

    User.findOne({ name:admNum }).then((user) => {
    if (!user) {
      console.log('User not found')
    } else {
        const result = user.password
            if(result == password){
                req.session.user = user;
                console.log(user.admNum);
                res.cookie('loggedIn', 'true');
                res.redirect("/home")
            }
            else    
                res.send("password does not match")    

    }
  })
  .catch((err) => {
    console.log(err);
  });
})



// verify-payment route


app.post('/verify-payment', async (req, res) => {
  const { paymentId, orderId, price, destination, way, date } = req.body;
  
  try {
    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    const { status, amount, currency, order_id, method } = payment;
    
    // Verify payment details
    if (status === 'captured' && amount == req.body.price && currency === 'INR' && order_id === orderId) {
      // Generate a barcode with the payment ID
      bwipjs.toBuffer({
        bcid: 'code128', // Specify the barcode type, e.g., code128
        text: paymentId, // Use the payment ID as the barcode data
        scale: 3, // Adjust the barcode size as needed
        height: 10, // Adjust the barcode height as needed
        includetext: true // Include the payment ID as text below the barcode
      }, function (err, png) {
        if (err) {
          console.error('Failed to generate barcode:', err);
          res.status(500).json({ error: 'Failed to generate barcode' });
        } else {
          // Save the barcode along with the payment data
          const newPayment = new Payment({
            orderId,
            paymentId,
            userId: req.session.user._id, // Replace with the actual user ID
            amount,
            destination,
            type: way,
            date,
            method,
            barcode: png // Save the generated barcode image as a field in the payment document
          });
          
          newPayment.save()
            .then((payment) => {
              console.log('Payment created:', payment);
              
              // Render the ticket page with the barcode
              res.render('ticket', { payment, barcode: png.toString('base64') });
            })
            .catch((err) => {
              console.error('Failed to create payment:', err);
              res.status(500).json({ error: 'Failed to create payment' });
            });
        }
      });
    } else {
      // Payment verification failed
      // Handle the failure case, update your records, etc.
      
      // Send a failure response to the client
      res.status(400).json({ success: false });
    }
  } catch (error) {
    // Error occurred while verifying payment
    // Handle the error case, update your records, etc.
    
    // Send an error response to the client
    res.status(500).json({ error: error.message });
  }
});




app.get("/scan",(req,res)=>{
  res.render("scan")
})


app.get('/process-barcode', async (req, res) => {
  const { barcodeNumber } = req.query;
  console.log('Received barcode number:', barcodeNumber);

  try {
    // Find the payment record by the barcode
    const payment = await Payment.findOne({ paymentId: barcodeNumber }).populate('userId');
  
    if (!payment) {
      // If no payment is found, send an appropriate response
      return res.status(404).json({ message: 'Payment not found' });
    }
  
    // Return the payment data as a response
    res.status(200).json({ payment });
  } catch (error) {
    // Error occurred while querying the database
    // Handle the error and send an error response
    res.status(500).json({ error: error.message });
  }
  
  
});


app.listen(port||3000, () => {
  console.log('Server is running on port 3000');
});






// app.get("/faculty",isLoggedIn,(req,res)=>