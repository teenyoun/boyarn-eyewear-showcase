(() => {
  const cards = document.querySelectorAll('.icbu-product-card');
  const products = [];
  const seen = new Set();
  
  cards.forEach(card => {
    const titleLink = card.querySelector('a.title-link, .title a, a[href*="product-detail"]');
    if (!titleLink) return;
    const name = titleLink.textContent.trim();
    const url = titleLink.href;
    if (!name || name.length < 5 || seen.has(url)) return;
    seen.add(url);
    
    let img = '';
    const imgEl = card.querySelector('img[src*="@sc"]');
    if (imgEl) {
      img = (imgEl.src || '').replace(/_\d+x\d+/, '_480x480');
      if (img.startsWith('//')) img = 'https:' + img;
    }
    
    let price = '';
    const txt = card.textContent.replace(/\s+/g, ' ');
    const pm = txt.match(/US\$[\d,.]+(\s*-\s*(?:US\$)?[\d,.]+)?/);
    if (pm) price = pm[0];
    
    products.push({ name, price, img, url });
  });
  
  // Get current page
  const currentBtn = document.querySelector('.next-pagination-item.current');
  const currentPage = currentBtn ? parseInt(currentBtn.textContent.trim()) || 1 : 1;
  
  // Click next if available
  const nextBtn = document.querySelector('.next-pagination-item.next button, .next-btn.next-pagination-item.next');
  let hasNext = false;
  if (nextBtn && !nextBtn.disabled) {
    nextBtn.click();
    hasNext = true;
  }
  
  return { products, currentPage, hasNext, count: products.length };
})()