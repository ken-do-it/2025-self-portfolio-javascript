# 운영 배포 기록 — 2026-11-03

## 2026-11-09 자동 번역 운영 배포 준비

사용자 승인에 따라 Production에 SUPABASE_URL, SUPABASE_SECRET_KEY, CRON_SECRET을 설정했다. 두 비밀값은 Vercel sensitive 유형이며 Preview에는 공유하지 않았다. 실제 DB를 연결한 Chrome에서 en/ja/es 번역 제목 검색, 목록과 상세 제목 일치, 한국어 원문 전환, 지도 링크 3개 표시 및 콘솔 오류 없음을 확인했다. 본문은 아직 번역 대기인 항목이 있어 원문/준비 안내가 표시된다. 무료 예산 내에서 제목 우선으로 순차 처리한다. 테스트 21개와 빌드가 통과한 소스를 main에 통합해 Git 자동 배포한다. 배포 후 READY 및 공개 주소 검증 결과는 최종 작업 보고를 따른다.

## 2026-11-09 DB 연결 검증 완료, 운영 배포 대기

`codex/persist-event-translations` 브랜치의 서버 코드를 새 Hiken 프로젝트 `ahnstjmnjpfstauzoxif`에 연결했다. Free 플랜, 뭄바이(`ap-south-1`) 리전이다. 원격 마이그레이션 2개 적용 및 서버 키 인증 성공, 실제 행사 746개 저장, 첫 배치 번역 126개 완료/실패 0. 세 외국어의 실제 DB 제목 검색과 목록·상세 API 번역 일치를 검증했다. 전체 번역은 아직 진행 대기 상태이며 다음 배치도 공유 하루 예산을 사용해야 한다.

일반 클라이언트의 Hiken 함수 실행 권한은 차단되어 있고 자동 RLS 트리거의 공개 실행 권한 경고는 수정했다. 보안 검사에는 private 테이블의 정책 부재 INFO 4개만 남으며 서버 전용 접근 구조상 의도된 상태다. [해당 검사 설명](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). 서버 비밀값은 `.env.local`에만 보관한다.

Vercel 환경변수 설정, 브라우저 통합 검증, main 통합·푸시 및 운영 배포는 아직 수행하지 않았다. 최신 재개 순서는 `TRANSLATION-RESUME.md` 상단을 참고한다. 아래의 DB 미연결 설명은 과거 작업 이력이다.

## 자동 번역 저장소 작업 — 아직 운영 미반영

이 절은 현재 로컬 작업 상태이며 아래의 기존 운영 배포 기록과 구분합니다. 대상 조직은 사용자가 지정한 `kenjustdoit_hiken`입니다. 연결된 Supabase 도구에서 현재 이 조직이 조회되지 않아 원격 프로젝트 생성, 마이그레이션 적용, 운영 환경변수 설정 및 main 푸시를 보류했습니다. 기존 `kenjustdoit_2_app / small-steps-todo`는 사용하지 않았습니다.

- 로컬 구현: 언어별 카드·상세 자동 표시, 원문 전환, 번역/한국어 동시 검색, 언어별 오프라인 저장 및 늦은 언어 응답 무시.
- 저장소: `supabase/migrations/20261109124414_event_translations.sql`. 공개 행사 원문과 필드별 번역을 `hiken_private` 스키마에 저장. 원문 해시가 달라진 필드만 다시 번역하며, 조회 시에도 해시를 확인해 오래된 번역을 제외.
- 보안: 모든 테이블 RLS 활성화, anon/authenticated 권한 없음. public RPC는 SECURITY INVOKER이며 service_role만 실행 가능. 서버용 secret API key만 사용하며 브라우저에는 키를 보내지 않음.
- 작업: `/api/syncTranslations`는 32자 이상 `CRON_SECRET`의 Bearer 인증 필수. DB 잠금으로 전역 하루 4,500자 예약. 제목 우선, 동일 문구 재사용, 실패/중단 작업은 lease 만료 후 재시도. 429/공급자 한도 응답은 당일 작업 중단. 방문자의 목록/상세 요청은 저장된 번역만 읽고 번역 API를 호출하지 않음.
- 무료 일정: Vercel Cron 매일 `15 1 * * *` UTC(한국 오전 10시대, Hobby는 정확한 분 보장 없음), 함수 300초/실제 작업 목표 240초. 한도 또는 실행시간에 도달하면 남은 작업은 다음 실행으로 이월. 전체 행사 즉시 번역을 보장하지 않음.
- 보존: 최신 유효 스냅샷에서 사라진 행사 및 종료 30일 이전 행사는 번역과 함께 정리. 예산 이력은 30일 보관. 개인 관심 행사와 검색어는 서버 DB에 저장하지 않음.
- 실패: DB 장애는 한국어 행사 조회를 막지 않음. 번역 오류/준비 상태를 표시. 오프라인은 언어별 최근 스냅샷을 최대 7일 사용. 날짜·원본 링크·지도 목적지 및 저장한 행사 ID는 원문 기준 유지.

### 운영 연결 후 수행할 순서

1. `kenjustdoit_hiken` 조직 ID/무료 플랜/프로젝트를 확인하고 전용 Hiken 프로젝트를 준비. 기존 테이블을 조회한 후 위 마이그레이션 적용.
2. Vercel `seoulactive`의 Production에만 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CRON_SECRET` 설정. secret은 채팅이나 Git에 기록하지 않고 서비스 설정에서 입력. 로컬 검증은 별도의 Development 키를 `.env.local`에 설정하며 기존 파일은 덮어쓰지 않음. Preview에는 운영 쓰기 키를 공유하지 않음.
3. `npm run sync:translations`로 실제 서울 행사 스냅샷 동기화 및 초기 번역. 이 명령 역시 DB 전역 한도를 사용. 실제 번역이 있는 행사로 en/ja/es 목록·상세·검색 확인; 아직 처리되지 않은 행사는 원문 표시가 정상.
4. DB 읽기/쓰기 권한과 보안 advisors, Cron 비인가 401, 실제 provider 한도/실패 응답, 브라우저 콘솔, 모바일 화면 확인 후 `npm run build`.
5. 검토한 파일만 main 커밋·푸시 → Vercel 자동 배포 READY/커밋 확인 → 공개 도메인에서 실제 데이터·번역·검색·지도 확인. 현재 이 단계는 수행하지 않음.

로컬 검증: 테스트 21개 및 빌드 통과. PGlite PostgreSQL 엔진에서 마이그레이션/권한/예산/해시/lease 검증. 격리된 예시 서버에서 Chrome 320·430px × 네 언어, 자동 상세 표시/원문 전환, 3개 외국어 검색 및 빠른 언어 변경을 확인. 가로 넘침 없음, 주요 버튼 최소 52px, 콘솔 오류 없음. 실제 API를 사용하는 로컬 서버에서는 DB 미설정 시에도 현재·예정 행사 314개와 한국어 원문이 표시되고 번역 불가 안내가 나타남을 확인. 실제 Android Chrome/iPhone Safari 기기 및 운영 DB 연동은 아직 미검증.

참고: [MyMemory 무료 한도](https://mymemory.translated.net/doc/usagelimits.php), [Vercel Cron 무료 플랜 제약](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel 함수 실행시간](https://vercel.com/docs/functions/limitations). 기존 운영 배포로 롤백할 때는 예약 작업을 비활성화하고 DB 데이터는 보존하여 재배포 시 재사용합니다.

## 기존 운영 배포 이력

- 공개 URL: https://www.hiken.org
- 추가 운영 별칭: https://hiken.org / https://seoulactivebyken.vercel.app
- Vercel team: `team_69AyfLuhUaGHbSuW49EQSMDI`
- Project: `seoulactive` (`prj_sbgKXPyGbVmmfMiFUwTmWznZINVC`)
- Production: `dpl_8SPt4mYqrovYvFHvBkaGL4raMKya`, READY, aliasError 없음
- Preview: `dpl_4zq85xzcAcT1zRrXhxzRPKgHHRaL`
- 이전 운영 배포(롤백 대상): `dpl_3xMu6mihBbCeTeiz5hLGvL7QwJGt`
- 소스 기준 HEAD: `375f5b2a9f0128d1e2a44f1e0e024a47c41c9e0b`, branch `kendoit_1`, **미커밋 변경 포함**. HEAD 자체와 배포 소스는 다름.
- 연결된 Vercel 도구로 허용 목록 38개 파일을 직접 전송. `.env*`, 기존 config.js, 캐시, node_modules, 개인 README, Git 메타데이터는 업로드 제외.
- Node 24.x, npm ci → npm run build, dist + 두 Node API 함수. tsconfig의 typeRoots를 명시하여 Vercel 함수 컴파일의 TS2688 오류 해결.
- `deployment-manifest.json`은 실제 전송 파일의 SHA-1/크기를 기록하며 비밀값과 파일 내용은 포함하지 않음.

## 운영 검증

| 흐름 | 결과 |
| --- | --- |
| 공개 HTTPS 접속 | 별도 로그인/보호 우회 없이 운영 화면 표시 |
| 행사 API | HTTP 200, 713개, 현재·예정 행사 314개, stale=false |
| 데이터 수집 시각 | 2026-11-03T09:39:36.659Z. 검증은 신선한 공개 스냅샷/캐시 응답이며, Vercel에서 6시간 만료 후 재수집까지 기다린 검증은 아님 |
| 실제 화면 | 314개 행사, 무료 228개, 25개 지역, 행사 검색/상세 표시 |
| UI 언어 | 한국어·영어·일본어·스페인어 전환 확인 |
| 번역 API | 운영 주소에서 제14회 인도영화제의 en/ja/es 요청 모두 HTTP 200, 번역문 반환 |
| 번역 UI | 영어 상세에서 Translate details → 14th Indian Film Festival 및 원문 전환 버튼 표시 |
| 네이버 지도 | 반포심산아트홀 검색 → 실제 시설 정보와 주소 표시 |
| 카카오 지도 | 반포심산아트홀을 목적지로 한 길찾기 화면 표시 |
| Google 지도 | 제공 좌표 목적지로 대중교통 경로 표시. 사용자 위치 권한을 새로 요청하거나 조작하지 않음 |
| 브라우저 콘솔 | 사이트 검증 중 error 로그 없음 |
| 빌드/테스트 | 로컬 strict/build 및 테스트 16개 통과; 운영 빌드 TypeScript 오류 없음 |

## 운영상 한계와 후속 배포

번역은 무료 MyMemory 한도와 기계번역 품질에 영향을 받습니다. 목록 제목은 원문이며 상세에서 번역을 요청합니다. Vercel /tmp 캐시 및 번역 한도는 인스턴스별이며 영속·전역 저장소가 아닙니다. 지도는 외부 서비스 연결이며 실제 위치 정확도는 서울시 원본 좌표/장소명에 의존합니다. 다중 장소/불명확한 장소명의 행사는 공식 안내를 확인해야 합니다.

최초 운영 배포는 로컬 소스를 직접 전송했습니다. 이후 동일한 앱 소스와 배포 설정을 Git 커밋 대상으로 정리했습니다. main은 이 변경을 포함해야 하며, 이후 자동 배포는 저장소의 package-lock.json, vercel.json 및 Node 24.x 설정을 사용합니다. 배포 문서와 해시 목록은 최초 수동 배포의 이력이며 이후 Git 배포의 커밋/상태는 Vercel 배포 기록에서 확인합니다.

롤백이 필요하면 Vercel 프로젝트에서 위의 이전 운영 배포를 선택하여 롤백합니다. 이번 작업에서는 롤백이나 배포 보호 해제를 실행하지 않았습니다.

## 후속 유지보수

- 앱 스크립트와 스타일은 내용에 따른 파일명을 사용해 이전 브라우저 캐시와 충돌하지 않게 합니다.
- HTML의 `Cache-Control`에 `no-transform`을 설정하여 Cloudflare의 통계 스크립트 자동 삽입을 막습니다. CSP는 자체 스크립트만 허용하는 설정을 유지합니다. 이 설정에서는 브라우저 기반 Cloudflare Web Analytics를 수집하지 않습니다. 근거: https://developers.cloudflare.com/web-analytics/faq/
- 상세 화면/번역/지도 표시를 `src/event-detail.ts`, 공통 DOM 생성과 날짜 표시를 `src/dom.ts`, `src/format.ts`로 분리했습니다.
- 사용하지 않는 `NEW` 화면과 중복 favicon 묶음을 삭제했습니다. 개인 README와 비밀 설정, 사이트 인증 파일은 보존합니다.
- `npm run build`는 타입/미사용 코드 검사 → 테스트 → 깨끗한 dist 생성 → 결과 검증 순으로 실행됩니다. 검증 실패 시 배포 빌드도 실패합니다.
- `scripts/verify-build.ts`는 실제 생성된 JS/CSS, HTML 참조, 오프라인 캐시, 오래된 번들 잔존 여부 및 no-transform 설정을 검사합니다.
