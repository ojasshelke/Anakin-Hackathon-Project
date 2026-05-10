(function () {
  var currentScript = document.currentScript;

  if (!currentScript) {
    console.error("VEXA Embed: Cannot find script tag.");
    return;
  }

  var apiKey = currentScript.getAttribute("data-key");
  var productId = currentScript.getAttribute("data-product-id");
  var productImage = currentScript.getAttribute("data-product-image");

  if (!apiKey || !productId || !productImage) {
    console.error("VEXA Embed: Missing required data attributes.");
    return;
  }

  // Derive base URL from the script source directly
  var scriptSrc = currentScript.src;
  var baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  var iframe = document.createElement("iframe");
  
  // Construct URL query parameters manually to support older browsers 
  // (though URLSearchParams is widely supported, pure concatenation is completely dependency-free)
  var queryUrl = baseUrl + "/embed?marketplace_key=" + encodeURIComponent(apiKey) 
               + "&product_id=" + encodeURIComponent(productId) 
               + "&product_image_url=" + encodeURIComponent(productImage);

  iframe.src = queryUrl;
  iframe.style.width = "100%";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.style.minHeight = "400px";
  iframe.style.borderRadius = "16px";
  iframe.style.transition = "height 0.2s ease-out";
  iframe.title = "VEXA Virtual Try-On";

  // Listen to messages from iframe to handle dynamic resizing
  window.addEventListener("message", function(event) {
    if (event.data && event.data.type === 'VEXA_EMBED_RESIZE') {
      if (event.data.height) {
        iframe.style.height = event.data.height + "px";
      }
    }
  });

  // Inject next to the script tag safely
  currentScript.parentNode.insertBefore(iframe, currentScript.nextSibling);

})();
