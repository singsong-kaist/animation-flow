# 컷 스토리 (cut-story-app)

스토리 텍스트를 업로드/붙여넣으면 자동으로 "컷"(스토리보드 패널) 단위로 나누고, 각 컷의 상세 정보와 첫 프레임 이미지를 보여주는 앱입니다.

## 시작하기

```bash
npm install
npm run dev
```

`.env.local`에 아래 값을 설정해야 합니다 (`OPENROUTER_API_KEY`는 기존 `fortune-app/.env.local`의 값을 그대로 복사해서 사용 가능).

```
OPENROUTER_API_KEY=sk-or-v1-...

# 컷 세그멘테이션에 사용할 모델 (tool-calling/구조화된 출력 지원 필요, 미설정 시 anthropic/claude-sonnet-4.5)
openrouter_model=anthropic/claude-sonnet-4.5

# 컷 첫 프레임 이미지 생성에 사용할 모델 (미설정 시 google/gemini-2.5-flash-image)
openrouter_image_model=google/gemini-2.5-flash-image
```

## 기능

- 입력 방식 3가지 모두 지원: 텍스트 붙여넣기, `.txt` 업로드, `.docx` 업로드
- 컷당 상세 정보: 장면 설명, 등장인물, 대사, 카메라 샷/앵글, 배경/시간대, 분위기/톤, 예상 컷 길이
- 컷별 첫 프레임 이미지 자동 생성 (병렬 생성, 컷별 독립 재시도)

## 사용 모델 (OpenRouter)

`.env.local`의 `openrouter_model` / `openrouter_image_model`로 지정합니다. 미설정 시 기본값이 사용됩니다.

- 컷 분석(세그멘테이션) 기본값: `anthropic/claude-sonnet-4.5` — tool-calling으로 구조화된 JSON 강제. 다른 모델로 바꾸는 경우 해당 모델이 OpenRouter에서 tool-calling(function calling)을 지원하는지 확인 필요.
- 이미지 생성 기본값: `google/gemini-2.5-flash-image`

## v1 제약사항

- **길이 상한**: 스토리는 최대 약 10,000자까지 지원합니다 (단일 LLM 호출 방식, 청킹 미지원). 더 긴 스토리는 나눠서 넣어주세요.
- **`.doc` 미지원**: 구버전 워드 파일(`.doc`)은 지원하지 않습니다. `.docx`로 저장 후 업로드해주세요. `.docx`의 표/이미지/서식은 텍스트 추출 시 무시됩니다(순수 텍스트만 사용).
- **영속성 없음**: 결과는 브라우저 세션에만 존재합니다. 새로고침하면 결과가 사라집니다 (DB/스토리지 연동 없음).
- **이미지는 base64 data URL**로 클라이언트에 직접 전달됩니다. 컷 수가 많으면 메모리 사용량이 커질 수 있습니다 — 영속화/공유 기능이 필요해지면 외부 스토리지(S3, Supabase Storage 등) 연동이 필요합니다.
