# 導入の手順

[English](README.md) | 日本語

エージェントが cc-web-stack を対象のリポジトリへ導入するときの手順です。正本は英語版で、エージェントは英語版に従います。この日本語版は人が読むための訳です。

## この手順の守り方

- 手順は順番どおりに実行する。飛ばさない、入れ替えない、足さない。
- 各手順の最後に**確認**がある。確認が通るまで次へ進まない。
- 確認が通らないとき、またはこの手順が想定していない状況になったときは、**止まって**「中断の報告」を送る（[報告](#報告)）。その場の判断で直さない。
- 導入の途中で cc-web-stack のリポジトリ自体を変更しない。
- 対象にすでにあるファイルを上書きしない。スクリプトがこれを守るので、迂回しない。
- 人の指示がない限り、対象でコミットも push もしない。

以下、`<meta>` はこの cc-web-stack の checkout の絶対パス、`<target>` は対象のリポジトリの絶対パスです。

## 手順 1. 対象を決める

- `<target>` を人の依頼から決める。書かれていない、またはあいまいなら聞く。
- プロジェクト名: 人が指定した名前。なければ `<target>` の最後の要素を小文字にしたもの。npm のパッケージ名として正しくなければ聞く。

**確認**: `<target>` とプロジェクト名を言える。

## 手順 2. 診断する

```bash
node <meta>/scripts/diagnose.mjs <target>
```

出力の JSON は報告に含めるので残しておく。

**確認**: `blockers` が空の配列である。空でなければ止まり、各 blocker を並べて中断の報告を送る。

## 手順 3. 作業できる状態にする

- `mode` が `new` のとき:
  - `<target>` がなければ作る。
  - `pnpm -v` を実行する。pnpm が入っていなければ止まる（宿主にツールを入れるには人の承認が要る）。
  - `isGitRepository` が false なら `git -C <target> init -b main` を実行する。
- `mode` が `existing` のとき:
  - `isGitRepository` が true なら、`git -C <target> status --porcelain` が何も出力しないこと。何か出たら止まる。
  - `isGitRepository` が true なら、ブランチを作る: `git -C <target> switch -c cc-web-stack/adopt`
- `<meta>` のコミットを記録する: `git -C <meta> rev-parse HEAD`

**確認**: 対象が存在し、作業ツリーがきれいで（既存モード）、meta のコミットのハッシュがある。

## 手順 4. スタックを入れる

### 新規モード

```bash
node <meta>/scripts/apply-template.mjs <meta>/templates/stack <target> PROJECT_NAME=<project-name>
node <meta>/scripts/apply-template.mjs <meta>/templates/lint <target>
cd <target> && pnpm install
```

**確認**: 2つの報告がどちらも `skipped: []` と `unresolvedVariables: []` で、`pnpm install` が 0 で終わる。

pnpm 11 は、公開されてから日の浅いパッケージを入れるのを保留します。固定した版がそれに当たると、`pnpm install` が `pnpm-workspace.yaml` に `minimumReleaseAgeExclude` を書き込みます。このファイルは pnpm が書いたまま残し、編集しません。

### 既存モード

診断の `packageManager` のパッケージマネージャを使う。追加のコマンドは次のとおり。

| packageManager | 版を固定して dev 依存に追加する |
|---|---|
| pnpm | `pnpm add -D -E <specs>` |
| npm | `npm install -D --save-exact <specs>` |
| yarn | `yarn add -D --exact <specs>` |
| bun | `bun add -d --exact <specs>` |

1. **TypeScript を並べて入れる。** `typescript.sideBySide` が true なら飛ばす。そうでなければ次を追加する:
   `@typescript/native@npm:typescript@7.0.2 typescript@npm:@typescript/typescript6@6.0.2`
2. **lint。** `eslintConfigs` が空でなければ飛ばし、`existing-eslint-config-kept` と記録する。空なら
   `eslint@10.11.0 typescript-eslint@8.70.1` を追加し、
   `node <meta>/scripts/apply-template.mjs <meta>/templates/lint <target>` を実行する。
3. **scripts。** `typecheck` = `tsc --noEmit`、`lint` = `eslint .`、`verify` = `<pm> run typecheck && <pm> run lint && <pm> run build` のそれぞれについて、`npm pkg get scripts.<name> --prefix <target>` を実行する。`{}` が出たら `npm pkg set scripts.<name>="<command>" --prefix <target>` で設定する。すでにあれば残し、`existing-script-kept:<name>` と記録する。

**確認**: どのコマンドも 0 で終わり、飛ばしたものがすべて記録されている。

## 手順 5. エージェントの入口を置く

```bash
node <meta>/scripts/apply-template.mjs <meta>/templates/agent-entry <target> PROJECT_NAME=<project-name> PACKAGE_MANAGER=<pm>
```

`<pm>` は、新規モードなら `pnpm`、既存モードなら診断の `packageManager`。

`skipped` が空でなければ、対象にはすでに独自の `AGENTS.md` か `CLAUDE.md` がある。統合しない。`existing-agent-entry-kept:<file>` と記録し、人が調整するものとして報告に挙げる。

**確認**: `unresolvedVariables` が空である。

## 手順 6. 検証する

```bash
cd <target> && <pm> run verify
```

**確認**: 0 で終わる。失敗したとき、通すために lint のルール・`tsconfig.json`・テンプレートを変えない。止まって、失敗の出力を添えて中断の報告を送る。

## 手順 7. 導入を記録する

`<target>/cc-web-stack.json` を、次の項目だけで書く。

```json
{
  "metaRepository": "https://github.com/YoshibaTakumu/cc-web-stack",
  "metaCommit": "<手順 3 のコミットのハッシュ>",
  "mode": "new",
  "adoptedAt": "<ISO 8601 の日付。例: 2026-09-23>",
  "packageManager": "<pm>",
  "skips": ["<手順 4〜5 で記録した飛ばしたもの>"],
  "verify": "passed"
}
```

**確認**: `node -e "JSON.parse(require('fs').readFileSync('<target>/cc-web-stack.json','utf8'))"` が 0 で終わる。

## 報告

報告の書式は英語版と同じものを使う（エージェントは英語版の書式で出力する）。

### 完了の報告

```
cc-web-stack adoption: done
- Target: <target> (<mode>)
- Meta commit: <hash>
- Created files: <apply-template の報告から>
- Skips: <一覧、または "none">
- Verify: passed (<pm> run verify)
- For a human: <人が調整するファイル、または "nothing">
- Not committed. Branch: <ブランチ、または "none">
```

### 中断の報告

```
cc-web-stack adoption: blocked at step <n>
- Target: <target>
- Reason: <blocker、または通らなかった確認>
- Evidence: <診断の JSON、またはコマンドの出力>
- Changes made so far: <一覧、または "none">
- Decision needed: <人に決めてほしいこと>
```
