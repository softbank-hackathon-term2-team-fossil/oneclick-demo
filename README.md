# OneClick demo

OneClick의 무중단 교체·장애 감지·자동 롤백 시연용 앱입니다. 브랜치마다 `scenario.txt` 한 줄만 다릅니다.

| 브랜치 | 동작 | 화면 |
|--------|------|------|
| `main` | 정상 | 파랑, v1 |
| `v2` | 정상 | 초록, v2 |
| `crash-on-start` | 시작하자마자 `exit 1` | - |
| `crash-after-30s` | 30초 정상 응답 후 `exit 1` | 빨강, v3 |
| `memory-leak` | 1초마다 Buffer 10MB를 붙잡음 (512MB 제한이면 약 50초 뒤 OOM) | 주황, v4 |

모든 응답에 `X-App-Version` 헤더로 버전을 넣습니다 (OneClick 측정 스크립트가 읽음).
