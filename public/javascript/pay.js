    
// // Get the entered amount from the form
// var price = document.getElementById("amount").value;
// var amount = price.replace("₹", "");

// // Generate the UPI payment link using the entered amount
// var upiLink = "upi://pay?pa=gopikrishna6003-1@oksbi&am=" + encodeURIComponent(amount);

// // Generate QR code using qrcode.js
// var qrcode = new QRCode(document.getElementById("qrcode"), {
//   text: upiLink,
//   width: 128,
//   height: 128
// });

// // Listen for the payment completion event
// document.getElementById("qrcode").addEventListener("click", function() {
//   // Perform any necessary actions after payment completion
//   // Redirect to a specific page using window.location.href
//   window.location.href = "https://www.google.com/";
// });
// rzp_test_EiwXDPM7Unp7ol   key
// 0yF80BHL12q7kiZHfn87Qb8d   secret
// const key = process.env.KEY_ID;
const key = "rzp_test_EiwXDPM7Unp7ol"

const order = document.getElementById("orderId").value
const payIdInput = document.getElementById("paymentIdinp")
const orderIdInput = document.getElementById("orderIdinp")
const form = document.getElementById('myForm');


// Generate the UPI payment link using the entered amount
var amount = document.getElementById("amount").value;
var options = {
  key: key,
  amount: amount,
  name: 'Your Company Name',
  order_id: order,
  handler: function(response) {
    console.log(response);
    var paymentId = response.razorpay_payment_id;
    var orderId = response.razorpay_order_id;

    payIdInput.value = paymentId
    orderIdInput.value = orderId
    form.submit();
    // Send the payment ID and order ID to your server for verification
    // You can use an AJAX request or any other method to send the data to your server-side endpoint
    // Here's an example using Fetch API to make the AJAX request
   
  },
  prefill: {
    email: 'user@example.com',
    contact: '1234567890'
  },
  theme: {
    color: '#F37254'
  }
};

var razorpayPayment = new Razorpay(options);
document.getElementById('pay-button').onclick = function(e) {
  // Open the Razorpay payment dialog when the button is clicked
  razorpayPayment.open();
  e.preventDefault();
}
