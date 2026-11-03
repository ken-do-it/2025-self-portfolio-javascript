# 자동 번역 작업 재개 안내

2026-11-03: 사용자 요청으로 Supabase 연결 및 운영 배포를 보류하고 `codex/persist-event-translations` 브랜치에 작업을 보관한다. main 및 운영 사이트는 변경하지 않는다.

## 현재 완료한 작업

- 네 언어 UI와 저장된 행사 번역을 카드·상세·검색에 연결. 원문 전환, 늦은 언어 응답 무시, 언어별 오프라인 저장.
- Supabase PostgreSQL 마이그레이션, 필드별 원문 해시 검증, 제목 우선 처리, 번역 재사용, 전역 하루 4,500자 예산 및 작업 lease.
- 인증된 일일 예약 작업. 목록/상세 요청은 저장된 번역만 읽는다.
- 테스트 21개 및 빌드 통과. 로컬 PostgreSQL 엔진으로 권한/예산/해시/lease 검증. Chrome 모바일 크기로 네 언어 및 번역 예시 확인.
- 운영 DB 생성·연결·마이그레이션·초기 번역 및 실제 휴대폰 검증은 아직 하지 않았다.

## 재개 순서

1. `git switch codex/persist-event-translations`로 이 브랜치에서 재개하고 작업 트리 상태부터 확인한다. 개인 파일 `README_LATEST.md`, `readme.md`와 `.env.local`은 보존한다.
2. 사용할 Supabase 계정·조직·프로젝트 ID를 다시 확인한다. 이전 지정 이름은 `kenjustdoit_hiken`이었지만, 사용자는 이후 다른 계정의 프로젝트 생성 화면을 제시했다. 스크린샷의 기본 조직을 확정 대상으로 간주하지 않는다. 기존 `kenjustdoit_2_app / small-steps-todo`를 수정하지 않는다.
3. 프로젝트 생성 시 Free 조직, 이름 `hiken`, 서울 리전(`ap-northeast-2`), Data API 켜기, 새 테이블 자동 노출 끄기, 자동 RLS 켜기를 권장한다. DB 비밀번호는 사용자가 생성하여 비밀번호 관리자에 저장하고 채팅/저장소에는 넣지 않는다. GitHub 연결은 이 앱의 DB 사용에 필수 아님.
4. Codex Supabase 연결에 해당 조직/프로젝트 접근 권한이 있는지 확인하고 기존 테이블을 조회한다. `supabase/migrations/20261103105720_event_translations.sql` 적용 후 권한 및 보안 advisors를 검사한다. 자동 노출을 꺼도 마이그레이션에서 필요한 서버 권한을 명시적으로 부여한다.
5. Vercel `seoulactive`의 Production에 `SUPABASE_URL`, 서버 전용 `SUPABASE_SECRET_KEY`, 무작위 32자 이상 `CRON_SECRET`을 설정한다. 비밀값은 Git/채팅에 넣지 않는다. Preview에는 운영 쓰기 키를 공유하지 않는다. 로컬 검증용 설정은 기존 `.env.local`을 덮어쓰지 않고 추가한다.
6. `npm run sync:translations`로 실제 서울 행사 동기화 및 초기 번역. 무료 한도 내에서 제목부터 순차 처리하므로 전체 행사 즉시 번역은 보장되지 않는다. API 제한 응답이 번역문으로 저장되지 않는지 확인한다.
7. 실제 번역된 행사로 en/ja/es 카드·상세·검색·원문 전환·지도 연결을 확인한다. 미번역/DB 장애/오프라인/언어 연속 변경도 확인한다. Cron 비인가 401, 중복 실행 예산과 lease 동작, 모바일 화면을 점검하고 `npm run build`를 실행한다.
8. 운영 연결 검증이 완료되고 사용자가 배포를 재개하면 main 최신 변경을 통합하고 재검증한 뒤 main에 반영·푸시한다. Vercel READY 및 소스 커밋을 확인하고 공개 주소에서 최종 검증한다. 지금은 main 병합·푸시·배포하지 않는다.

## 참고

- 상세 구조와 기존 배포 이력: `DEPLOYMENT.md`.
- 로컬 예시 화면: `npm run preview:fixture` (4180 포트, 실제 행사와 구분된 테스트 데이터).
- 무료 한도는 조직 개수가 아닌 Supabase 계정의 활성 무료 프로젝트 수 기준이다. GPT/Codex 연결이나 GitHub 저장소 연결 변경이 한도를 늘려주지는 않는다.
- 서비스 로그인용 GitHub, 프로젝트 생성 화면의 GitHub 저장소 연결, Codex의 Supabase 접근 권한은 서로 다른 연결이다.
