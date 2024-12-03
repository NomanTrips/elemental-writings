(function () {
    // Theme management
    function getCookie(name) {
      let matches = document.cookie.match(
        new RegExp(
          '(?:^|; )' +
            name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
            '=([^;]*)'
        )
      );
      return matches ? decodeURIComponent(matches[1]) : undefined;
    }
  
    function setCookie(name, value, options = {}) {
      options = {
        path: '/',
        // add other defaults here if necessary
        ...options
      };
  
      if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
      }
  
      let updatedCookie =
        encodeURIComponent(name) + '=' + encodeURIComponent(value);
  
      for (let optionKey in options) {
        updatedCookie += '; ' + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
          updatedCookie += '=' + optionValue;
        }
      }
  
      document.cookie = updatedCookie;
    }
  
    let theme = getCookie('theme');
  
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      // Use system preference
      let prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  
    // Add theme toggle button
    let toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Theme';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.addEventListener('click', function () {
      let currentTheme = document.documentElement.getAttribute('data-theme');
      let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      setCookie('theme', newTheme, { 'max-age': 3600 * 24 * 365 });
    });
    document.body.appendChild(toggleButton);
  
    // Client-side navigation using History API
    function ajaxLoad(url) {
      fetch(url)
        .then(response => response.text())
        .then(html => {
          document.open();
          document.write(html);
          document.close();
        })
        .catch(err => console.error('Error loading page:', err));
    }
  
    document.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        let href = event.target.getAttribute('href');
        if (href.startsWith('/')) {
          event.preventDefault();
          history.pushState(null, '', href);
          ajaxLoad(href);
        }
      }
    });
  
    window.addEventListener('popstate', function (event) {
      ajaxLoad(location.pathname);
    });
  })();