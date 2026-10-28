/* Page environment controls. SDK routing and enhancement policy stay in the SDK. */
(function (root) {
    'use strict';
    function controls(container, options) {
        const prefix = options && options.idPrefix || '';
        const names = new Map();
        return Array.from(container.querySelectorAll('input,select')).map(element => {
            const count = names.get(element.name) || 0;
            names.set(element.name, count + 1);
            const key = element.dataset.enhancement ? 'enhancement:' + element.dataset.enhancement :
                element.dataset.vr ? 'vr:' + element.dataset.vr :
                element.id ? 'id:' + (prefix && element.id.startsWith(prefix) ? element.id.slice(prefix.length) : element.id) :
                    element.name ? 'name:' + element.name + ':' + count : null;
            return {key, element};
        }).filter(item => item.key);
    }
    root.captureDemoControls = function (container, options) {
        return controls(container, options).map(({key, element}) => ({key, value:element.value, checked:element.checked === true}));
    };
    root.restoreDemoControls = function (container, saved, options) {
        if (!Array.isArray(saved)) throw new Error('Invalid saved controls');
        const values = new Map(saved.filter(x => x && typeof x.key === 'string').map(x => [x.key,x]));
        const current = controls(container, options);
        function applyValue(element, value) {
            if (!value || typeof value.value !== 'string') return;
            if (element.dataset.enhancement === 'target' && value.value && value.value !== 'step' &&
                /^\d+x\d+@(1\.25|1\.5|2)$/.test(value.value) && !Array.from(element.options).some(x => x.value === value.value)) {
                // The SDK may not have dimensions yet. The enhancement controller
                // retains this requested target and reports actual availability.
                element.add(new Option(value.value, value.value));
            }
            element.value = value.value;
            if (element.type === 'checkbox' || element.type === 'radio') element.checked = value.checked === true;
        }
        for (const {key, element} of current) applyValue(element, values.get(key));
        // Ordinary preset events can overwrite a custom URL. Only replay the
        // enhancement preferences, in order, before any player is created.
        for (const name of ['color','target','audio','sr']) {
            const item = current.find(x => x.element.dataset.enhancement === name);
            if (!item || !values.has(item.key)) continue;
            const value = values.get(item.key);
            applyValue(item.element, value);
            item.element.dispatchEvent(new Event('change', {bubbles:true}));
        }
    };
    root.createPlaybackEnvironmentControls = function (panel, actions) {
        if (!panel) return null;
        const zh = panel.dataset.locale !== 'en';
        const t = (en, cn) => zh ? cn : en;
        const requested = new URL(root.location.href).searchParams.get('isolation') === '1';
        const isolated = root.crossOriginIsolated === true && typeof root.SharedArrayBuffer === 'function';
        const storageKey = 'h265web:environment:' + root.location.origin + root.location.pathname;
        panel.classList.add('demo-environment');
        panel.innerHTML = `<strong>${t('Playback environment', '播放环境')}</strong>
            <p data-environment="status" role="status" aria-live="polite"></p>
            <p>${t('Compatibility mode keeps native cross-origin playback available. Software decoding needs an isolated page. Super resolution can work on native playback without this switch.', '兼容模式保留原生跨域播放。软件解码需要隔离页面；原生播放的超分可独立开启。')}</p>
            <button type="button" data-environment="switch">${requested ? t('Return to compatibility mode', '切回兼容模式') : t('Enable software decoding', '启用软件解码')}</button>
            <small>${t('This reloads the page. Player URLs, core choices, volume/mute and enhancement settings are kept in this tab. Cross-origin media in isolated mode needs the media server to permit access.', '切换会重载页面，本标签页保留媒体地址、内核、音量/静音和增强设置。隔离模式的跨域媒体需要来源服务器允许访问。')}</small>`;
        const output = panel.querySelector('[data-environment="status"]');
        const button = panel.querySelector('[data-environment="switch"]');
        output.dataset.isolated = String(isolated);
        const environmentText = isolated ? t('Software decoding environment is ready. Codec support still depends on this browser.', '软件解码环境已就绪，具体编解码能力取决于当前浏览器。') :
            requested ? t('Software decoding is not ready: this server has not enabled the required isolation headers, or this is not a secure context. Adding a query parameter alone cannot enable it.', '软件解码环境未就绪：服务器未启用所需隔离响应头，或当前页面不是安全上下文。仅添加网址参数不会生效。') :
                t('Compatibility mode. Native playback is available; software decoding needs the environment switch.', '当前为兼容模式，可使用原生播放；软件解码需切换环境。');
        output.textContent = environmentText;
        if (isolated && !requested) {
            button.disabled = true;
            button.textContent = t('Isolation is already enabled by this host', '当前服务器已启用隔离');
        }
        button.addEventListener('click', function () {
            const next = new URL(root.location.href);
            if (requested) next.searchParams.delete('isolation'); else next.searchParams.set('isolation','1');
            try {
                const saved = {version:1, savedAt:Date.now(), isolation:!requested, data:actions.capture()};
                root.sessionStorage.setItem(storageKey, JSON.stringify(saved));
            } catch (_) {
                output.textContent = t('Settings could not be saved in this tab. The page has not reloaded; allow session storage and retry.', '无法保存本标签页的设置，页面尚未重载；请允许会话存储后重试。');
                return;
            }
            root.location.assign(next.href);
        });
        let restored = false;
        try {
            const raw = root.sessionStorage.getItem(storageKey);
            if (raw) {
                const saved = JSON.parse(raw);
                const age = Date.now() - saved.savedAt;
                if (saved.version === 1 && age >= 0 && age < 10 * 60 * 1000 && saved.isolation === requested) {
                    actions.restore(saved.data);
                    restored = true;
                    output.textContent = environmentText + ' ' + t('Settings restored.', '设置已恢复。');
                }
                root.sessionStorage.removeItem(storageKey);
            }
        } catch (_) {
            try { root.sessionStorage.removeItem(storageKey); } catch (_) {}
            output.textContent = environmentText + ' ' + t('Saved settings could not be restored. Check the controls before loading.', '保存的设置未能恢复，请检查控件后再加载。');
        }
        return {isolated, requested, restored};
    };
}(window));
