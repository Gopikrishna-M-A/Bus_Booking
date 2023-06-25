// Get the camera container element
const cameraContainer = document.getElementById('camera');

// Configure the QuaggaJS barcode scanner
Quagga.init({
  inputStream: {
    name: 'Live',
    type: 'LiveStream',
    target: cameraContainer,
    constraints: {
      facingMode: 'environment' // Set the camera to use the back camera (if available)
    }
  },
  decoder: {
    readers: ['code_128_reader'] // Change the reader to 'code_128_reader' for Code 128 barcodes
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  // Start the barcode scanning
  Quagga.start();
});

// Add a listener for successful barcode scans
Quagga.onDetected(function(result) {
  const barcodeNumber = result.codeResult.code;
  console.log('Barcode Number:', barcodeNumber);
//   document.getElementById('barcodeNumber').textContent = barcodeNumber;

  // Send the barcodeNumber to the server for processing
  const url = `/process-barcode?barcodeNumber=${encodeURIComponent(barcodeNumber)}`;
  fetch(url).then(response => response.json())
  .then(data => {
    // Handle the response from the server
    console.log('Server Response:', data);
    if(data.payment){
        const orderId = document.getElementById("orderId")
        const paymentId = document.getElementById("paymentId")
        const name = document.getElementById("name")
        const colId = document.getElementById("colId")
        const amount = document.getElementById("amount")
        const destination = document.getElementById("destination")
        const way = document.getElementById("way")
        amount.value = data.payment.amount
        orderId.value = data.payment.orderId
        paymentId.value = data.payment.paymentId
        name.value = data.payment.userId.admNum
        colId.value = data.payment.userId.name
        destination.value = data.payment.destination
        way.value = data.payment.type

    }
    
    // Update the UI or perform additional actions based on the response
  })
  .catch(error => {
    console.error('Error:', error);
    // Handle the error case
  });
});
