function be(e){window.enmity.plugins.registerPlugin(e)}

const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.0.0",
    description: "무량공처를 막아줍니다.",
    authors: [{ name: "A", id: "0" }],

    onStart() {
        const patcher = window.enmity.patcher.create("AntiReDoS");
        const getByProps = (...e) => window.enmity.modules.getByProps(...e);

        const MarkdownModule = getByProps("defaultBlockParse");

        if (!MarkdownModule) {
            console.warn("[AntiReDoS] defaultBlockParse 모듈을 찾지 못했습니다.");
            return;
        }

        this._patcher = patcher;

        patcher.before(MarkdownModule, "defaultBlockParse", (_, args) => {
            if (args[0] && typeof args[0] === "string") {
                args[0] = args[0].replace(
                    /(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g,
                    ""
                );
            }
        });

        console.log("[AntiReDoS] 활성화됨");
    },

    onStop() {
        if (this._patcher) {
            this._patcher.unpatchAll();
        }
        console.log("[AntiReDoS] 비활성화됨");
    },
};

be(AntiReDoS);
