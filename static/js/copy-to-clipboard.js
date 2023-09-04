let quoteText = document.querySelector('#copy-to-clipboard-text');
let handleCopyClick = document.querySelector('#copy-to-clipboard-btn');

// Update the date for "cite this page" section
let today = new Date();
let dd = String(today.getDate()).padStart(2, '0');
let mm = today.toLocaleString('default', { month: 'long' }); //January is 0!
let yyyy = today.getFullYear();

today = '[' + dd + ' ' + mm + ' ' + yyyy + '].';
document.getElementById("js-page-date").innerHTML = today;

handleCopyClick.addEventListener('click', () => {
  let text = quoteText.textContent;
  navigator.clipboard.writeText(`${text}`);
});
