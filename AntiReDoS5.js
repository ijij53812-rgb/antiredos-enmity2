const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.2.1",
    description: "iOS 환경 대응 무량공처 방지",
    authors: [{ name: "A", id: "0" }],

    onStart() {
        // Enmity가 로드된 후에도 모듈들이 비동기로 로드될 수 있음을 고려
        this.attemptPatch();
    },

    attemptPatch() {
        const { patcher, modules } = window.enmity;
        
        // iOS에서 추측 가능한 마크다운 관련 키워드들
        const targets = ["parse", "markdown", "component", "MessageContent"];
        let patched = false;

        for (const target of targets) {
            const module = modules.getByProps(target);
            if (module) {
                // 패치 시도
                try {
                    this._patcher = patcher.create("AntiReDoS");
                    this._patcher.before(module, target, (args) => {
                        if (args[0] && typeof args[0] === "string") {
                            args[0] = args[0].replace(/(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g, "");
                        }
                    });
                    console.log(`[AntiReDoS] ${target} 패치 성공`);
                    patched = true;
                    break;
                } catch (e) {
                    continue;
                }
            }
        }

        if (!patched) {
            // 모듈을 즉시 찾지 못했다면 2초 뒤 재시도
            setTimeout(() => this.attemptPatch(), 2000);
        }
    },

    onStop() {
        if (this._patcher) {
            this._patcher.unpatchAll();
        }
    },
};

window.enmity.plugins.registerPlugin(AntiReDoS);