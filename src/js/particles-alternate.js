document.addEventListener("DOMContentLoaded", function(event) {
  /* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
  particlesJS.load('particles-js', 'assets/particles-alternate.json', function() {
    console.log('callback - particles.js config loaded');
  });
})