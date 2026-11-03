# 운영 배포 기록 — 2026-11-03

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
