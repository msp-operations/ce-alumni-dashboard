/**
 * CE Alumni Network - Homepage rendering
 *
 * Everything on the homepage that carries a number reads CE_DATA, so the
 * annual update stays a data.js edit and nothing here needs hand-patching.
 *
 * Load order in index.html: data.js -> ce-render.js -> inline map script.
 * This file runs synchronously; every element it writes to is parsed before it.
 *
 * Where this differs from the MSP site, it is because the programme is much
 * younger: 46 graduates over two cohorts rather than 1,527 over thirteen.
 * Ranked lists are short, most universities appear once, and one of the four
 * concentrations has no graduates yet. Those are stated rather than hidden.
 */

(function () {
    'use strict';

    if (typeof CE_DATA === 'undefined') {
        console.error('CE_DATA not loaded. data.js must come before ce-render.js');
        return;
    }

    var D = CE_DATA;
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    var el = function (id) { return document.getElementById(id); };
    var set = function (id, text) { var e = el(id); if (e) e.textContent = text; };

    /* ----------------------------------------------------------------
       1. Map counts
       Natural Earth (world-atlas 110m) names differ from data.js for a
       couple of countries. Only the ones CE actually has are mapped.
       ---------------------------------------------------------------- */
    var ATLAS_NAME = {
        'United States': 'United States of America',
        'Czech Republic': 'Czechia',
        'South Korea': 'South Korea'
    };

    var counts = {};
    var located = 0;
    D.countriesLivingIn.forEach(function (c) {
        counts[ATLAS_NAME[c.name] || c.name] = c.count;
        located += c.count;
    });
    window.CE_MAP_COUNTS = counts;

    /* ----------------------------------------------------------------
       2. Headline figures
       ---------------------------------------------------------------- */
    var S = D.summary;
    set('hero-total', fmt(S.totalAlumni));
    set('stat-alumni', fmt(S.totalAlumni));
    set('stat-nationalities', fmt(S.nationalities));
    set('stat-countries', fmt(S.countriesLivingIn));
    set('stat-unis', fmt(S.universitiesAttended));
    set('world-count', fmt(S.countriesLivingIn));
    set('uni-total', fmt(S.universitiesAttended));

    var years = (D.graduationByYear || []).slice().sort(function (a, b) { return a.year - b.year; });
    if (years.length) {
        set('hero-cohorts', years.length === 1
            ? 'One cohort so far, graduating in ' + years[0].year + '.'
            : years.length + ' cohorts so far, ' + years[0].year + ' to ' + years[years.length - 1].year + '.');
    }

    /* ----------------------------------------------------------------
       3. Map legend
       "Elsewhere" is the located total minus the Netherlands, not the
       headline total: location is known for `located` of the graduates.
       ---------------------------------------------------------------- */
    var nl = D.countriesLivingIn.filter(function (c) { return c.code === 'nl'; })[0];
    var nlCount = nl ? nl.count : 0;
    set('legend-nl', nlCount + ' in the Netherlands');
    set('legend-rest', (located - nlCount) + ' elsewhere, in ' +
        (S.countriesLivingIn - (nlCount ? 1 : 0)) + ' countries');

    /* ----------------------------------------------------------------
       4. Alumni stories
       ---------------------------------------------------------------- */
    var storyWrap = el('story-list');
    if (storyWrap && D.studentStories) {
        storyWrap.innerHTML = D.studentStories.map(function (s) {
            var place = s.location ? (s.location.city + ', ' + s.location.country) : '';
            var role = [s.currentStatus, s.university].filter(Boolean).join(' &middot; ');
            return '' +
                '<a class="story" href="community.html">' +
                  '<span class="chip">' + esc(s.concentration || '') + '</span>' +
                  '<p class="story-quote">&ldquo;' + esc(trimQuote(s.quote)) + '&rdquo;</p>' +
                  '<span class="story-by">' +
                    '<span class="story-name">' + esc(s.name) + '</span>' +
                    '<span class="story-role">' + role + (place ? ' &middot; ' + esc(place) : '') + '</span>' +
                  '</span>' +
                '</a>';
        }).join('');
    }

    /* ----------------------------------------------------------------
       5. Concentrations
       One track currently has no graduates. It still belongs on the page,
       so the card says so rather than showing an empty bar.
       ---------------------------------------------------------------- */
    var concWrap = el('conc-list');
    if (concWrap && D.concentrations) {
        var withGrads = D.concentrations.filter(function (c) { return c.count > 0; });
        concWrap.innerHTML = D.concentrations.map(function (c) {
            var body = c.count > 0
                ? '<span class="conc-count"><span class="conc-num">' + c.count + '</span>' +
                  '<span class="conc-share">' + c.percentage + '% of graduates</span></span>'
                : '<span class="conc-empty">No graduates yet</span>';
            return '' +
                '<div class="conc">' +
                  '<span class="conc-dot" style="background:' + esc(c.color || '#10B981') + '"></span>' +
                  '<span class="conc-name">' + esc(c.name) + '</span>' +
                  body +
                  '<p class="conc-desc">' + esc(c.description || '') + '</p>' +
                '</div>';
        }).join('');

        set('conc-lead', 'Every CE student picks one of four concentrations. ' +
            numWord(withGrads.length) + ' of the four have produced graduates so far; the programme is young enough that the fourth has not yet.');
    }

    /* ----------------------------------------------------------------
       6. Countries
       ---------------------------------------------------------------- */
    var ranked = D.countriesLivingIn.slice().sort(function (a, b) { return b.count - a.count; });
    var countryWrap = el('country-list');
    if (countryWrap && ranked.length) {
        var countryMax = ranked[0].count;
        countryWrap.innerHTML = ranked.map(function (c, i) {
            var band = i === 0 ? 'bar-navy' : (i < 5 ? 'bar-blue' : 'bar-orange');
            return '' +
                '<div class="row">' +
                  flagImg(c.code) +
                  '<span class="row-name">' + esc(c.name) + '</span>' +
                  '<span class="track row-track"><span class="fill ' + band + '" style="width: ' +
                      Math.max(3, Math.round((c.count / countryMax) * 100)) + '%"></span></span>' +
                  '<span class="row-num">' + c.count + '</span>' +
                '</div>';
        }).join('');
    }

    var big = ranked[0];
    if (big) {
        set('world-lead', big.name + ' holds ' + big.count + ' of the ' + located +
            ' graduates whose location we know, ' + Math.round((big.count / located) * 100) +
            '%. The rest are spread across ' + (ranked.length - 1) + ' more countries.');
    }
    set('country-note', 'Every country with a CE graduate is listed.');

    /* ----------------------------------------------------------------
       7. Universities
       Counts run 3, 2 and 1. Showing a ranked top ten of mostly ones is
       noise, so only the universities with more than one graduate get a
       row and the single-graduate tail is summarised.
       ---------------------------------------------------------------- */
    var uniWrap = el('uni-list');
    if (uniWrap && D.topUniversities) {
        var unis = D.topUniversities.slice().sort(function (a, b) { return b.count - a.count; });
        var repeated = unis.filter(function (u) { return u.count > 1; });
        var singles = unis.length - repeated.length;
        var uniMax = repeated.length ? repeated[0].count : 1;

        uniWrap.innerHTML = repeated.map(function (u, i) {
            return '' +
                '<div class="uni">' +
                  '<span class="uni-rank">' + String(i + 1).padStart(2, '0') + '</span>' +
                  '<span class="uni-logo">' + uniLogo(u) + '</span>' +
                  '<span class="uni-main">' +
                    '<span class="uni-name">' + esc(u.name) + '</span>' +
                    '<span class="uni-country">' + esc(u.country || '') + '</span>' +
                  '</span>' +
                  '<span class="track track-lg"><span class="fill bar-navy" style="width: ' +
                      Math.round((u.count / uniMax) * 100) + '%"></span></span>' +
                  '<span class="uni-num">' + u.count + '</span>' +
                '</div>';
        }).join('');

        set('uni-note', singles > 0
            ? 'Plus ' + singles + ' more universities with one CE graduate each.'
            : '');
    }

    /* ----------------------------------------------------------------
       8. Studying vs working, and the cohorts
       ---------------------------------------------------------------- */
    var emp = D.employment;
    if (emp && el('status-bar')) {
        var total = emp.studying + emp.working;
        el('status-bar').innerHTML =
            '<span style="width:' + (emp.studying / total * 100) + '%;background:var(--blue)"></span>' +
            '<span style="width:' + (emp.working / total * 100) + '%;background:var(--accent)"></span>';
        el('status-key').innerHTML =
            '<span><span class="split-swatch" style="background:var(--blue)"></span>' + emp.studying + ' studying</span>' +
            '<span><span class="split-swatch" style="background:var(--accent)"></span>' + emp.working + ' working</span>';
        set('status-title', emp.studying > emp.working
            ? 'Most are still studying.'
            : 'Most are already working.');
        set('status-note', 'Of ' + total + ' graduates we have a current status for, ' +
            Math.round(emp.studying / total * 100) + '% are in a master’s or doctorate and ' +
            Math.round(emp.working / total * 100) + '% are in work.');
    }

    if (el('cohort-list') && years.length) {
        el('cohort-list').innerHTML = years.map(function (y) {
            return '<div><div class="cohort-num">' + y.count + '</div>' +
                   '<div class="cohort-label">Class of ' + y.year + '</div></div>';
        }).join('');
    }

    /* ----------------------------------------------------------------
       9. Footer data line
       ---------------------------------------------------------------- */
    set('data-note', (D.lastUpdated ? 'Data current as of ' + D.lastUpdated + '. ' : '') +
        fmt(S.totalAlumni) + ' records.');

    /* ---- helpers ---- */

    function numWord(n) {
        return ['zero','one','two','three','four'][n] || String(n);
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    // Quotes in data.js run long; the card holds roughly this much.
    function trimQuote(q) {
        if (!q) return '';
        q = String(q).replace(/^["“]|["”]$/g, '').trim();
        if (q.length <= 150) return q;
        var cut = q.slice(0, 150);
        var stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '), cut.lastIndexOf(' '));
        return cut.slice(0, stop > 80 ? stop : 150).replace(/[,.]$/, '') + '…';
    }

    // Flags from flagcdn, decorative only, so the country name carries meaning.
    function flagImg(code) {
        if (!code) return '';
        return '<img class="row-flag" src="https://flagcdn.com/w160/' + esc(code.toLowerCase()) +
               '.png" alt="" aria-hidden="true" loading="lazy" onerror="this.remove()" />';
    }

    // Logos are local files. A missing file removes only the image.
    function uniLogo(u) {
        if (!u.logo) return '';
        return '<img src="assets/logos/' + esc(u.logo) + '" alt="" aria-hidden="true" ' +
               'loading="lazy" onerror="this.remove()" />';
    }
})();
