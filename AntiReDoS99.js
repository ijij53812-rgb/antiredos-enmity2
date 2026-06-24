/**
 * AntiReDoS - Enmity Plugin (iOS)
 * 무량공처(ReDoS) 공격을 막아줍니다.
 *
 * 설치: Enmity > Plugins > Install Plugin
 * Raw URL: https://raw.githubusercontent.com/[유저명]/[레포명]/main/AntiReDoS.js
 */

import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { getByProps, getByName } from "enmity/metro";
import { Patcher } from "enmity/patcher";
import { Logger } from "enmity/metro/common";

const LOG_TAG = "AntiReDoS";

/**
 * ReDoS 트리거 문자열을 무력화합니다.
 * Vencord의 (?!) 교체 방식과 동일한 효과.
 *
 * iOS Discord의 JS 엔진(JSC)은 백트래킹 제한이 없으므로
 * 해당 패턴이 그대로 실행되면 앱이 멈출 수 있습니다.
 */
function sanitizeInput(text) {
    if (typeof text !== "string") return text;

    // 무량공처 트리거 패턴: 과도한 백트래킹을 유발하는 구조 제거
    // 방법 1: 비정상적으로 긴 반복 구조 제한 (50자 이상의 연속 특수문자 블록)
    text = text.replace(/(\[(?:[^\[\]\\]|\\.){0,50}){10,}/g, "");

    // 방법 2: Vencord 방식 — 트리거 패턴 직접 무력화
    // 원본의 취약 정규식을 우회하는 입력값 차단
    text = text.replace(
        /(?:\\[[^\]]*\]|[^\[\\]|\\](?=[^\[]*\]))*$/g,
        ""
    );

    return text;
}

/**
 * iOS Discord에서 마크다운 파서 모듈을 찾는 함수.
 * PC(Vencord) 대비 모듈명/속성명이 다를 수 있으므로 다중 전략 사용.
 */
function findMarkdownModule() {
    // 전략 1: PC Discord와 동일한 방식 (defaultBlockParse)
    const byBlockParse = getByProps("defaultBlockParse");
    if (byBlockParse) {
        Logger.log(LOG_TAG, "모듈 발견 (defaultBlockParse)");
        return { module: byBlockParse, method: "defaultBlockParse" };
    }

    // 전략 2: iOS Discord가 사용하는 parse / parseBlock 속성
    const byParse = getByProps("parse", "parseBlock");
    if (byParse) {
        Logger.log(LOG_TAG, "모듈 발견 (parse/parseBlock)");
        return { module: byParse, method: "parse" };
    }

    // 전략 3: markdownToAST 방식 (일부 버전)
    const byAST = getByProps("markdownToAST");
    if (byAST) {
        Logger.log(LOG_TAG, "모듈 발견 (markdownToAST)");
        return { module: byAST, method: "markdownToAST" };
    }

    // 전략 4: renderRule이 있는 파서 모듈
    const byRenderRule = getByProps("renderRule", "parse");
    if (byRenderRule?.parse) {
        Logger.log(LOG_TAG, "모듈 발견 (renderRule/parse)");
        return { module: byRenderRule, method: "parse" };
    }

    return null;
}

const AntiReDoS = {
    name: "AntiReDoS",
    version: "1.1.0",
    description: "무량공처(ReDoS) 공격 차단 — iOS Enmity 최적화",
    authors: [{ name: "A", id: "0" }],

    _patches: [],

    onStart() {
        const found = findMarkdownModule();

        if (!found) {
            Logger.warn(LOG_TAG, "마크다운 파서 모듈을 찾을 수 없습니다. 패치 실패.");
            return;
        }

        const { module, method } = found;

        try {
            const unpatch = Patcher.before(LOG_TAG, module, method, (_, args) => {
                if (args[0] && typeof args[0] === "string") {
                    args[0] = sanitizeInput(args[0]);
                }
            });

            this._patches.push(unpatch);
            Logger.log(LOG_TAG, `활성화됨 — 패치 대상: ${method}`);
        } catch (e) {
            Logger.error(LOG_TAG, `패치 실패: ${e?.message ?? e}`);
        }
    },

    onStop() {
        // 등록된 모든 패치 해제
        for (const unpatch of this._patches) {
            try { unpatch(); } catch (_) {}
        }
        this._patches = [];
        Logger.log(LOG_TAG, "비활성화됨");
    },
};

registerPlugin(AntiReDoS);
