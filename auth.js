(function () {
  if (sessionStorage.getItem('dl_portfolio_auth') !== 'true') {
    window.location.replace('index.html');
  }
})();
