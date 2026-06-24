function be(e){window.enmity.plugins.registerPlugin(e)}

const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.0.0",
    description: "무량공처를 막아줍니다.",
    authors: [{ name: "A", id: "0" }],

    onStart() {
        const patcher = window.enmity.patcher.create("AntiReDoS");
        this._patcher = patcher;

        const getByProps = (...e) => window.enmity.modules.getByProps(...e);

        // ReDoS 유발 패턴 제거 함수
        const sanitize = (text) => {
            if (typeof text !== "string") return text;
            // 무량공처 트리거: 대괄호가 비정상적으로 많이 중첩된 패턴
            if ((text.match(/\[/g) || []).length > 10) {
                return text.replace(/[\[\]\\]{3,}/g, "");
            }
            return text;
        };

        let patched = false;

        // 방법 1: 메시지 렌더링 모듈
        try {
            const MessageModule = getByProps("renderMessageContent") 
                || getByProps("renderContent");
            if (MessageModule) {
                const key = MessageModule.renderMessageContent ? "renderMessageContent" : "renderContent";
                patcher.before(MessageModule, key, (_, args) => {
                    if (args[0]?.content) args[0].content = sanitize(args[0].content);
                });
                console.log("[AntiReDoS] 방법1 패치 성공:", key);
                patched = true;
            }
        } catch(e) { console.warn("[AntiReDoS] 방법1 실패:", e); }

        // 방법 2: parse 계열 모듈
        try {
            const ParseModule = getByProps("parse", "parseTopic")
                || getByProps("parse", "parseEmbedTitle");
            if (ParseModule) {
                patcher.before(ParseModule, "parse", (_, args) => {
                    if (args[0]) args[0] = sanitize(args[0]);
                });
                console.log("[AntiReDoS] 방법2 패치 성공: parse");
                patched = true;
            }
        } catch(e) { console.warn("[AntiReDoS] 방법2 실패:", e); }

        // 방법 3: 메시지 디스패치 후킹
        try {
            const MsgStore = getByProps("getMessage", "getMessages");
            const Dispatcher = window.enmity.modules.common.Dispatcher;
            if (Dispatcher) {
                const handler = (e) => {
                    if (e?.message?.content) {
                        e.message.content = sanitize(e.message.content);
                    }
                };
                Dispatcher.subscribe("MESSAGE_CREATE", handler);
                Dispatcher.subscribe("MESSAGE_UPDATE", handler);
                this._handler = handler;
                this._dispatcher = Dispatcher;
                console.log("[AntiReDoS] 방법3 패치 성공: Dispatcher");
                patched = true;
            }
        } catch(e) { console.warn("[AntiReDoS] 방법3 실패:", e); }

        if (!patched) {
            console.error("[AntiReDoS] 모든 패치 방법 실패");
        }
    },

    onStop() {
        if (this._patcher) this._patcher.unpatchAll();
        if (this._dispatcher && this._handler) {
            this._dispatcher.unsubscribe("MESSAGE_CREATE", this._handler);
            this._dispatcher.unsubscribe("MESSAGE_UPDATE", this._handler);
        }
    },
};

be(AntiReDoS);
