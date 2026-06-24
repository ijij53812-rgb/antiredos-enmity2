function be(e){window.enmity.plugins.registerPlugin(e)}

const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.0.0",
    description: "무량공처를 막아줍니다.",
    authors: [{ name: "A", id: "0" }],

    onStart() {
        const patcher = window.enmity.patcher.create("AntiReDoS");
        const bulk = (...e) => window.enmity.modules.bulk(...e);
        const filters = window.enmity.modules.filters;

        // defaultBlockParse 여러 방법으로 탐색
        let MarkdownModule =
            window.enmity.modules.getByProps("defaultBlockParse") ||
            window.enmity.modules.getByProps("parse", "defaultBlockParse") ||
            bulk(filters.byProps("defaultBlockParse"))[0];

        if (!MarkdownModule) {
            // 못 찾으면 전체 모듈 스캔
            console.warn("[AntiReDoS] getByProps 실패, 전체 스캔 시도...");
            const allModules = window.enmity.modules;
            // 모든 모듈에서 defaultBlockParse 포함된 것 찾기
            try {
                MarkdownModule = allModules.getByProps("defaultBlockParse", "parse");
            } catch(e) {
                console.warn("[AntiReDoS] 스캔 실패:", e);
            }
        }

        if (!MarkdownModule) {
            console.error("[AntiReDoS] 모듈을 찾지 못했습니다. Discord 버전이 다를 수 있습니다.");
            return;
        }

        console.log("[AntiReDoS] 모듈 찾음:", Object.keys(MarkdownModule));

        this._patcher = patcher;

        // defaultBlockParse 패치
        if (MarkdownModule.defaultBlockParse) {
            patcher.before(MarkdownModule, "defaultBlockParse", (_, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = args[0].replace(
                        /(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g,
                        ""
                    );
                }
            });
            console.log("[AntiReDoS] defaultBlockParse 패치 완료");
        }

        // parse도 같이 패치 (iOS Discord는 parse를 쓸 수도 있음)
        if (MarkdownModule.parse) {
            patcher.before(MarkdownModule, "parse", (_, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = args[0].replace(
                        /(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g,
                        ""
                    );
                }
            });
            console.log("[AntiReDoS] parse 패치 완료");
        }
    },

    onStop() {
        if (this._patcher) {
            this._patcher.unpatchAll();
        }
    },
};

be(AntiReDoS);
