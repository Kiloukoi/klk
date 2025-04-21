// Ad loader script to help bypass ad blockers
(function() {
  // Function to create and load ads
  function loadAds() {
    // Find all ad containers
    const adContainers = document.querySelectorAll('[data-ad-container="true"]');
    
    adContainers.forEach((container, index) => {
      // Skip if already processed
      if (container.getAttribute('data-processed') === 'true') return;
      
      // Mark as processed
      container.setAttribute('data-processed', 'true');
      
      // Get container dimensions
      const rect = container.getBoundingClientRect();
      
      // Only process visible containers with dimensions
      if (rect.width > 0 && rect.height > 0) {
        // Create iframe if not already created
        if (!container.querySelector('iframe')) {
          const iframe = document.createElement('iframe');
          
          // Set iframe attributes
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.style.overflow = 'hidden';
          iframe.loading = 'eager';
          iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
          
          // Get URL from data attribute or use default
          let url = container.getAttribute('data-ad-url');
          
          // If no URL is specified, use a default based on container type
          if (!url) {
            if (container.getAttribute('data-position') === 'left') {
              url = 'https://phoampor.top/4/9211914';
            } else if (container.getAttribute('data-position') === 'right') {
              url = 'https://phoampor.top/4/9211914';
            } else if (container.getAttribute('data-ad-listing') === 'true') {
              url = 'https://phoampor.top/4/9154484';
            } else {
              url = 'https://phoampor.top/4/9154371';
            }
          }
          
          // Add random parameters to bypass caching
          const randomParam = Math.floor(Math.random() * 1000000);
          const timestamp = Date.now();
          iframe.src = `${url}?${randomParam}&t=${timestamp}&ref=${encodeURIComponent(window.location.hostname)}&idx=${index}`;
          
          // Clear container and append iframe
          container.innerHTML = '';
          container.appendChild(iframe);
        }
      }
    });
  }
  
  // Load ads on page load
  if (document.readyState === 'complete') {
    loadAds();
  } else {
    window.addEventListener('load', loadAds);
  }
  
  // Also load ads when DOM content is loaded
  document.addEventListener('DOMContentLoaded', loadAds);
  
  // Periodically check for new ad containers
  setInterval(loadAds, 2000);
})();