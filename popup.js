/**
 * Search Place - popup.js
 * Author: Majid Haghighi
 * LinkedIn: https://www.linkedin.com/in/haghighiofficial/
 * 
 * Official Google UULE (Encoded Location Parameter) Generator & Localized SERP Tool
 */

(() => {
  // DOM References
  const activeLocationBadge = document.getElementById('activeLocationBadge');
  const addFavoriteBtn = document.getElementById('addFavoriteBtn');
  const favoritesList = document.getElementById('favoritesList');

  const queryInput = document.getElementById('queryInput');
  const countrySelect = document.getElementById('countrySelect');
  const citySelect = document.getElementById('citySelect');
  const regionSelect = document.getElementById('regionSelect');
  const customRegionRow = document.getElementById('customRegionRow');
  const customRegionInput = document.getElementById('customRegionInput');

  const citySearchInput = document.getElementById('citySearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const autocompleteDropdown = document.getElementById('autocompleteDropdown');

  const previewCanonical = document.getElementById('previewCanonical');
  const previewCountryCode = document.getElementById('previewCountryCode');
  const previewUule = document.getElementById('previewUule');

  const searchGoogleBtn = document.getElementById('searchGoogleBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const copyBtnText = document.getElementById('copyBtnText');

  // Active State
  let currentCountry = null;
  let currentCity = null;
  let currentDistrict = null;
  let currentCanonical = '';
  let currentCountryCode = 'us';

  // Autocomplete debounce state
  let autocompleteDebounceTimer = null;
  let activeSearchQuery = '';

  // Default Presets
  const DEFAULT_FAVORITES = [
    { label: "New York", canonical: "New York,New York,United States", countryCode: "us" },
    { label: "Manhattan", canonical: "Manhattan,New York,United States", countryCode: "us" },
    { label: "London", canonical: "London,England,United Kingdom", countryCode: "gb" },
    { label: "Dubai", canonical: "Dubai,Dubai,United Arab Emirates", countryCode: "ae" },
    { label: "Tehran", canonical: "Tehran,Tehran Province,Iran", countryCode: "ir" },
    { label: "Shemiranat", canonical: "Shemiranat,Tehran Province,Iran", countryCode: "ir" }
  ];

  let userFavorites = [];

  /**
   * Official Google UULE Generation Algorithm
   * Canonical Format: "w+CAIQICI" + lengthChar + base64(canonicalName)
   */
  function generateUULE(canonicalName) {
    if (!canonicalName || typeof canonicalName !== 'string') return '';
    const trimmed = canonicalName.trim();
    if (!trimmed) return '';

    const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const len = trimmed.length;
    const lengthChar = len < table.length ? table[len] : table[table.length - 1];

    let b64 = '';
    try {
      b64 = btoa(unescape(encodeURIComponent(trimmed)));
    } catch (e) {
      b64 = btoa(trimmed);
    }

    return `w+CAIQICI${lengthChar}${b64}`;
  }

  /**
   * Build complete Google localized search URL
   */
  function buildSearchUrl(query, canonical, countryCode) {
    const cleanQuery = query.trim();
    const uule = generateUULE(canonical);
    const searchUrl = new URL('https://www.google.com/search');

    if (cleanQuery) {
      searchUrl.searchParams.set('q', cleanQuery);
    }
    if (uule) {
      searchUrl.searchParams.set('uule', uule);
    }
    if (countryCode) {
      searchUrl.searchParams.set('gl', countryCode.toLowerCase());
    }

    return searchUrl.toString();
  }

  /**
   * Initialize on popup load
   */
  async function init() {
    populateCountriesDropdown();
    await loadFavoritesAndState();
    setupEventListeners();
    updatePreviewDisplay();
  }

  /**
   * Populate Country Dropdown
   */
  function populateCountriesDropdown() {
    countrySelect.innerHTML = '';
    COUNTRIES_DATA.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      countrySelect.appendChild(opt);
    });
  }

  /**
   * Populate Region / District Dropdown for currently selected city
   */
  function populateRegionsDropdown(selectedRegionCanonical = '') {
    regionSelect.innerHTML = '';
    customRegionRow.classList.add('hidden');
    customRegionInput.value = '';

    // Option 1: Entire City (All Districts)
    const optAll = document.createElement('option');
    optAll.value = '__all__';
    optAll.textContent = 'All Districts (Entire City)';
    regionSelect.appendChild(optAll);

    // Populate pre-defined districts if available
    const districts = currentCity && currentCity.districts ? currentCity.districts : [];
    districts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.canonical;
      opt.textContent = d.name;
      regionSelect.appendChild(opt);
    });

    // Custom District Option
    const optCustom = document.createElement('option');
    optCustom.value = '__custom__';
    optCustom.textContent = 'Custom District / Area...';
    regionSelect.appendChild(optCustom);

    if (selectedRegionCanonical) {
      if (selectedRegionCanonical === '__all__') {
        regionSelect.value = '__all__';
        currentDistrict = null;
        currentCanonical = currentCity ? currentCity.canonical : '';
      } else {
        const matched = districts.find(d => d.canonical.toLowerCase() === selectedRegionCanonical.toLowerCase());
        if (matched) {
          regionSelect.value = matched.canonical;
          currentDistrict = matched;
          currentCanonical = matched.canonical;
        } else {
          // Custom region
          regionSelect.value = '__custom__';
          customRegionRow.classList.remove('hidden');
          const shortName = selectedRegionCanonical.split(',')[0];
          customRegionInput.value = shortName;
          currentDistrict = null;
          currentCanonical = selectedRegionCanonical;
        }
      }
    } else {
      regionSelect.value = '__all__';
      currentDistrict = null;
      currentCanonical = currentCity ? currentCity.canonical : '';
    }
  }

  /**
   * Populate City Dropdown for a given country
   */
  function populateCitiesDropdown(countryCode, selectCityCanonical = '', selectRegionCanonical = '') {
    const country = COUNTRIES_DATA.find(c => c.code === countryCode) || COUNTRIES_DATA[0];
    currentCountry = country;
    currentCountryCode = country.code;

    citySelect.innerHTML = '';
    country.cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city.canonical;
      opt.textContent = city.name;
      citySelect.appendChild(opt);
    });

    // Custom option in case user wants to type arbitrary city
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = 'Custom city...';
    citySelect.appendChild(customOpt);

    if (selectCityCanonical) {
      const exists = country.cities.some(ct => ct.canonical === selectCityCanonical);
      if (exists) {
        citySelect.value = selectCityCanonical;
        currentCity = country.cities.find(ct => ct.canonical === selectCityCanonical);
      } else {
        citySelect.value = '__custom__';
        currentCity = country.cities[0];
      }
    } else {
      citySelect.selectedIndex = 0;
      currentCity = country.cities[0];
    }

    populateRegionsDropdown(selectRegionCanonical);
  }

  /**
   * Set location directly by canonical name (city or district)
   */
  function setLocation(canonical, countryCode = '', countryName = '', cityName = '', districtName = '') {
    if (!canonical) return;
    const cleanCanonical = canonical.trim();
    currentCanonical = cleanCanonical;

    // Check if canonical matches one of our known flat locations
    const found = ALL_LOCATIONS_FLAT.find(item => item.canonical.toLowerCase() === cleanCanonical.toLowerCase());
    if (found) {
      countrySelect.value = found.countryCode;
      currentCountryCode = found.countryCode;

      if (found.type === 'district') {
        const country = COUNTRIES_DATA.find(c => c.code === found.countryCode);
        const cityObj = country ? country.cities.find(ct => ct.name === found.cityName) : null;
        const cityCanonical = cityObj ? cityObj.canonical : '';
        populateCitiesDropdown(found.countryCode, cityCanonical, found.canonical);
      } else {
        populateCitiesDropdown(found.countryCode, found.canonical, '__all__');
      }
    } else {
      // Dynamic location from live API or custom input
      const code = (countryCode || currentCountryCode || 'us').toLowerCase();
      currentCountryCode = code;

      // Ensure country exists in dropdown
      let countryOpt = countrySelect.querySelector(`option[value="${code}"]`);
      if (!countryOpt && countryName) {
        countryOpt = document.createElement('option');
        countryOpt.value = code;
        countryOpt.textContent = countryName;
        countrySelect.appendChild(countryOpt);
      }
      if (countryOpt) countrySelect.value = code;

      const parts = cleanCanonical.split(',');
      const specific = parts[0] ? parts[0].trim() : '';
      const resolvedCity = cityName || (parts.length > 2 ? parts[1].trim() : specific);
      const resolvedDistrict = districtName || (parts.length > 2 ? specific : '');

      populateCitiesDropdown(code, '', '');

      // Add dynamic city option if not in dropdown
      let cityOpt = citySelect.querySelector(`option[value="${resolvedCity}"]`);
      if (!cityOpt && resolvedCity) {
        cityOpt = document.createElement('option');
        cityOpt.value = resolvedCity;
        cityOpt.textContent = resolvedCity;
        citySelect.insertBefore(cityOpt, citySelect.lastElementChild);
      }
      if (cityOpt) citySelect.value = resolvedCity;

      populateRegionsDropdown('');
      if (resolvedDistrict && resolvedDistrict.toLowerCase() !== resolvedCity.toLowerCase()) {
        const regOpt = document.createElement('option');
        regOpt.value = cleanCanonical;
        regOpt.textContent = resolvedDistrict;
        regionSelect.insertBefore(regOpt, regionSelect.lastElementChild);
        regionSelect.value = cleanCanonical;
      } else {
        regionSelect.value = '__all__';
      }

      currentCanonical = cleanCanonical;
    }

    updatePreviewDisplay();
    saveLastState();
  }

  /**
   * Update all preview cards and badge
   */
  function updatePreviewDisplay() {
    const uule = generateUULE(currentCanonical);
    previewCanonical.textContent = currentCanonical || '-';
    previewCanonical.title = currentCanonical || '';

    previewCountryCode.textContent = currentCountryCode.toUpperCase();

    previewUule.textContent = uule || '-';
    previewUule.title = uule ? `${uule} (Click to copy)` : '';

    // Header badge
    let shortCity = currentCanonical.split(',')[0] || 'Selected';
    activeLocationBadge.textContent = `${shortCity}, ${currentCountryCode.toUpperCase()}`;
    activeLocationBadge.title = currentCanonical;

    updateActiveFavoritePill();
  }

  /**
   * Event Listeners setup
   */
  function setupEventListeners() {
    // Country change
    countrySelect.addEventListener('change', () => {
      const code = countrySelect.value;
      populateCitiesDropdown(code);
      updatePreviewDisplay();
      saveLastState();
    });

    // City change
    citySelect.addEventListener('change', () => {
      if (citySelect.value === '__custom__') {
        citySearchInput.focus();
        citySearchInput.select();
      } else {
        const country = COUNTRIES_DATA.find(c => c.code === countrySelect.value);
        if (country) {
          currentCity = country.cities.find(ct => ct.canonical === citySelect.value);
        }
        populateRegionsDropdown('__all__');
        updatePreviewDisplay();
        saveLastState();
      }
    });

    // Region / District change
    regionSelect.addEventListener('change', () => {
      const val = regionSelect.value;
      if (val === '__all__') {
        customRegionRow.classList.add('hidden');
        customRegionInput.value = '';
        currentDistrict = null;
        currentCanonical = currentCity ? currentCity.canonical : '';
      } else if (val === '__custom__') {
        customRegionRow.classList.remove('hidden');
        customRegionInput.focus();
        const customName = customRegionInput.value.trim();
        if (customName) {
          const cityPart = currentCity ? currentCity.name.split(',')[0].trim() : '';
          const countryPart = currentCountry ? currentCountry.name : '';
          currentCanonical = `${customName},${cityPart},${countryPart}`;
        }
      } else {
        customRegionRow.classList.add('hidden');
        customRegionInput.value = '';
        currentCanonical = val;
        if (currentCity && currentCity.districts) {
          currentDistrict = currentCity.districts.find(d => d.canonical === val);
        }
      }
      updatePreviewDisplay();
      saveLastState();
    });

    // Custom Region Input
    customRegionInput.addEventListener('input', () => {
      const customName = customRegionInput.value.trim();
      if (customName) {
        const cityPart = currentCity ? currentCity.name.split(',')[0].trim() : '';
        const countryPart = currentCountry ? currentCountry.name : '';
        currentCanonical = `${customName},${cityPart},${countryPart}`;
      } else {
        currentCanonical = currentCity ? currentCity.canonical : '';
      }
      updatePreviewDisplay();
      saveLastState();
    });

    // Autocomplete input with live suggestions
    citySearchInput.addEventListener('input', () => {
      handleAutocompleteSearch(citySearchInput.value);
    });

    citySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const firstItem = autocompleteDropdown.querySelector('.autocomplete-item');
        if (firstItem) {
          firstItem.click();
        } else {
          const val = citySearchInput.value.trim();
          if (val) {
            setLocation(val, currentCountryCode);
            autocompleteDropdown.classList.add('hidden');
          }
        }
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      citySearchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      autocompleteDropdown.classList.add('hidden');
      clearTimeout(autocompleteDebounceTimer);
    });

    // Click outside to close autocomplete
    document.addEventListener('click', (e) => {
      if (!citySearchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
        autocompleteDropdown.classList.add('hidden');
      }
    });

    // Copy UULE on click
    previewUule.addEventListener('click', () => {
      const code = previewUule.textContent;
      if (code && code !== '-') {
        navigator.clipboard.writeText(code);
        showFeedback(previewUule, 'Copied!');
      }
    });

    // Add to Favorites button
    addFavoriteBtn.addEventListener('click', () => {
      saveCurrentAsFavorite();
    });

    // Search on Google primary button
    searchGoogleBtn.addEventListener('click', () => {
      executeGoogleSearch();
    });

    // Press Enter in query input
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeGoogleSearch();
      }
    });

    // Copy URL button
    copyUrlBtn.addEventListener('click', () => {
      const url = buildSearchUrl(queryInput.value, currentCanonical, currentCountryCode);
      navigator.clipboard.writeText(url);
      copyUrlBtn.classList.add('copied');
      copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        copyUrlBtn.classList.remove('copied');
        copyBtnText.textContent = 'Copy URL';
      }, 1800);
    });
  }

  /**
   * Fetch Live Global Suggestions from OpenStreetMap Nominatim with English translation
   */
  async function fetchLiveGlobalSuggestions(query) {
    if (!query || query.trim().length < 2) return [];
    const q = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6&accept-language=en`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SearchPlaceLocator/1.1' }
      });
      if (!response.ok) return [];

      const items = await response.json();
      if (!Array.isArray(items)) return [];

      return items.map(item => {
        const addr = item.address || {};
        const country = addr.country || '';
        const countryCode = (addr.country_code || '').toLowerCase();
        const state = addr.state || addr.province || addr.region || '';
        const city = addr.city || addr.town || addr.municipality || addr.county || '';
        const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.district || '';
        const primaryName = item.name || district || city || query;

        const isDistrict = !!(district && district.toLowerCase() !== city.toLowerCase()) || 
                           (item.type === 'neighbourhood' || item.type === 'suburb' || item.type === 'quarter');

        let canonicalParts = [];
        if (primaryName) canonicalParts.push(primaryName);
        if (city && city.toLowerCase() !== primaryName.toLowerCase()) canonicalParts.push(city);
        else if (state && state.toLowerCase() !== primaryName.toLowerCase()) canonicalParts.push(state);
        if (country) canonicalParts.push(country);

        const canonical = canonicalParts.join(',');

        let displaySubtitle = '';
        if (isDistrict && city) {
          displaySubtitle = city + (country ? ', ' + country : '');
        } else if (state || country) {
          displaySubtitle = (state ? state + ', ' : '') + country;
        }

        return {
          type: isDistrict ? 'district' : 'city',
          isLive: true,
          displayName: primaryName + (displaySubtitle ? ` (${displaySubtitle})` : ''),
          cityName: city || primaryName,
          districtName: isDistrict ? primaryName : '',
          countryName: country,
          countryCode: countryCode,
          canonical: canonical
        };
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Autocomplete search handler with Hybrid (Local 0ms + Live API) Search
   */
  function handleAutocompleteSearch(query) {
    const q = query.trim();
    activeSearchQuery = q.toLowerCase();

    if (!q) {
      clearSearchBtn.classList.add('hidden');
      autocompleteDropdown.classList.add('hidden');
      clearTimeout(autocompleteDebounceTimer);
      return;
    }

    clearSearchBtn.classList.remove('hidden');

    // 1. Instant local matches (0ms response)
    const localMatches = ALL_LOCATIONS_FLAT
      .filter(item => item.searchKey.includes(activeSearchQuery))
      .slice(0, 6);

    renderAutocompleteResults(localMatches, [], q);

    // 2. Debounced Live API Suggestions
    clearTimeout(autocompleteDebounceTimer);
    if (q.length >= 2) {
      autocompleteDebounceTimer = setTimeout(async () => {
        try {
          const liveResults = await fetchLiveGlobalSuggestions(q);
          if (activeSearchQuery === q.toLowerCase()) {
            renderAutocompleteResults(localMatches, liveResults, q);
          }
        } catch (e) {
          // If offline or failed, keep local results
        }
      }, 250);
    }
  }

  /**
   * Render Autocomplete Results (Combining Local + Live results cleanly)
   */
  function renderAutocompleteResults(localResults, liveResults, rawQuery) {
    autocompleteDropdown.innerHTML = '';

    // Merge and deduplicate by canonical
    const combined = [...localResults];
    const seenCanonicals = new Set(localResults.map(r => r.canonical.toLowerCase()));

    liveResults.forEach(item => {
      const key = item.canonical.toLowerCase();
      if (!seenCanonicals.has(key)) {
        seenCanonicals.add(key);
        combined.push(item);
      }
    });

    if (combined.length === 0) {
      autocompleteDropdown.innerHTML = `
        <div class="autocomplete-item" id="acUseCustom">
          <span class="ac-city-name">Use custom: "${rawQuery}"</span>
          <span class="ac-country-name">Press Enter or click to search this custom location</span>
        </div>
      `;
      document.getElementById('acUseCustom').addEventListener('click', () => {
        setLocation(rawQuery, currentCountryCode);
        autocompleteDropdown.classList.add('hidden');
        citySearchInput.value = '';
        clearSearchBtn.classList.add('hidden');
      });
      autocompleteDropdown.classList.remove('hidden');
      return;
    }

    combined.slice(0, 8).forEach(m => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';

      let badgeClass = m.isLive ? 'live' : m.type;
      let badgeLabel = m.isLive ? 'Global' : (m.type === 'district' ? 'District' : 'City');
      const badgeHtml = `<span class="ac-badge ${badgeClass}">${badgeLabel}</span>`;

      const titleText = m.districtName && m.cityName
        ? `${m.districtName} (${m.cityName})`
        : (m.displayName || m.cityName || m.canonical.split(',')[0]);

      item.innerHTML = `
        <span class="ac-city-name">${titleText} ${badgeHtml}</span>
        <span class="ac-country-name">${m.countryName || ''} &bull; ${m.canonical}</span>
      `;

      item.addEventListener('click', () => {
        setLocation(m.canonical, m.countryCode, m.countryName, m.cityName, m.districtName);
        autocompleteDropdown.classList.add('hidden');
        citySearchInput.value = '';
        clearSearchBtn.classList.add('hidden');
      });

      autocompleteDropdown.appendChild(item);
    });

    // Custom option at bottom of list
    const customItem = document.createElement('div');
    customItem.className = 'autocomplete-item';
    customItem.style.borderTop = '1px solid #E2E8F0';
    customItem.innerHTML = `
      <span class="ac-city-name" style="color: #025F57; font-weight: 600;">+ Use custom: "${rawQuery}"</span>
      <span class="ac-country-name">Set as custom location string</span>
    `;
    customItem.addEventListener('click', () => {
      setLocation(rawQuery, currentCountryCode);
      autocompleteDropdown.classList.add('hidden');
      citySearchInput.value = '';
      clearSearchBtn.classList.add('hidden');
    });
    autocompleteDropdown.appendChild(customItem);

    autocompleteDropdown.classList.remove('hidden');
  }

  /**
   * Execute Google Search in new tab
   */
  function executeGoogleSearch() {
    const q = queryInput.value.trim();
    if (!q) {
      queryInput.focus();
      return;
    }

    const targetUrl = buildSearchUrl(q, currentCanonical, currentCountryCode);
    chrome.tabs.create({ url: targetUrl });
    saveLastState();
  }

  /**
   * Favorites / Presets Management
   */
  async function loadFavoritesAndState() {
    try {
      const data = await chrome.storage.local.get(['searchPlaceFavorites', 'searchPlaceLastState']);

      if (data.searchPlaceFavorites && Array.isArray(data.searchPlaceFavorites) && data.searchPlaceFavorites.length > 0) {
        userFavorites = data.searchPlaceFavorites;
      } else {
        userFavorites = DEFAULT_FAVORITES;
      }

      renderFavorites();

      // Per user requirement, queryInput is NEVER cached or restored across sessions - always starts clean
      queryInput.value = '';

      if (data.searchPlaceLastState) {
        const last = data.searchPlaceLastState;
        if (last.canonical) {
          setLocation(last.canonical, last.countryCode || 'us');
          return;
        }
      }

      // Default initial location: New York, US
      countrySelect.value = 'us';
      populateCitiesDropdown('us', 'New York,New York,United States');
    } catch (e) {
      userFavorites = DEFAULT_FAVORITES;
      renderFavorites();
      countrySelect.value = 'us';
      populateCitiesDropdown('us');
    }
  }

  function renderFavorites() {
    favoritesList.innerHTML = '';
    if (userFavorites.length === 0) {
      favoritesList.innerHTML = '<span class="empty-fav-hint">Click Save to bookmark current location</span>';
      return;
    }

    userFavorites.forEach((fav, idx) => {
      const pill = document.createElement('div');
      pill.className = 'fav-pill';
      pill.setAttribute('data-canonical', fav.canonical);
      pill.title = `${fav.label} • ${fav.canonical}`;
      pill.innerHTML = `
        <span class="fav-label">${fav.label}</span>
        <span class="fav-remove-btn" title="Remove ${fav.label}" data-index="${idx}">&times;</span>
      `;

      pill.querySelector('.fav-label').addEventListener('click', () => {
        setLocation(fav.canonical, fav.countryCode);
      });

      pill.querySelector('.fav-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(idx);
      });

      favoritesList.appendChild(pill);
    });

    updateActiveFavoritePill();
  }

  function updateActiveFavoritePill() {
    const pills = favoritesList.querySelectorAll('.fav-pill');
    pills.forEach(p => {
      if (p.getAttribute('data-canonical') === currentCanonical) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  function saveCurrentAsFavorite() {
    if (!currentCanonical) return;

    // Derive clean, descriptive label for the favorite pill
    let label = '';
    if (currentDistrict && currentDistrict.name) {
      label = currentDistrict.name.split('(')[0].trim();
    } else if (currentCity && currentCity.name) {
      label = currentCity.name.split(',')[0].trim();
    } else {
      label = currentCanonical.split(',')[0].trim();
    }

    const cleanCanon = currentCanonical.trim();
    const exists = userFavorites.some(f => f.canonical.toLowerCase() === cleanCanon.toLowerCase());

    if (!exists) {
      userFavorites.push({
        label: label || 'Preset',
        canonical: cleanCanon,
        countryCode: currentCountryCode
      });

      chrome.storage.local.set({ searchPlaceFavorites: userFavorites });
      renderFavorites();
      showFeedback(addFavoriteBtn, 'Saved!');
    } else {
      showFeedback(addFavoriteBtn, 'Already saved');
    }
  }

  function removeFavorite(index) {
    userFavorites.splice(index, 1);
    chrome.storage.local.set({ searchPlaceFavorites: userFavorites });
    renderFavorites();
  }

  function saveLastState() {
    // Only location and country preferences are preserved; query is NOT saved per user requirement
    chrome.storage.local.set({
      searchPlaceLastState: {
        canonical: currentCanonical,
        countryCode: currentCountryCode
      }
    });
  }

  function showFeedback(element, message) {
    const originalText = element.textContent;
    element.textContent = message;
    setTimeout(() => {
      element.textContent = originalText;
    }, 1200);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
