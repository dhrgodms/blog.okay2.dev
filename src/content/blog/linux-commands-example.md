---
title: "자주 쓰는 리눅스 명령어 정리"
description: "터미널에서 자주 사용하는 리눅스 명령어들을 예시와 함께 정리합니다."
category: "Linux"
pubDate: "Aug 12 2026"
---

![linux](https://i.namu.wiki/i/05bM37HIAaf0N__gSO45HyYv0RTiufrhv7Qj8ApMyYXsaANx9gp8l3H06H5dulQQEp5jn1v95Rr6SVqpOh8Wfg.svg)

터미널 작업을 하다 보면 자주 쓰게 되는 명령어들을 정리해봅니다.

## 파일 및 디렉토리 탐색

```bash
ls -la
```

현재 디렉토리의 모든 파일(숨김 파일 포함)을 상세 정보와 함께 보여줍니다.

```bash
cd /path/to/directory
```

지정한 경로로 디렉토리를 이동합니다.

```bash
pwd
```

현재 작업 중인 디렉토리의 절대 경로를 출력합니다.

## 파일 검색

```bash
find . -name "*.md"
```

현재 디렉토리 하위에서 확장자가 `.md`인 파일을 모두 찾습니다.

```bash
grep -r "TODO" ./src
```

`src` 디렉토리 안에서 "TODO" 문자열이 포함된 파일을 재귀적으로 검색합니다.

## 프로세스 관리

```bash
ps aux | grep node
```

실행 중인 프로세스 중 "node"가 포함된 프로세스를 확인합니다.

```bash
kill -9 <PID>
```

지정한 PID의 프로세스를 강제 종료합니다.

## 권한 관리

```bash
chmod +x script.sh
```

`script.sh` 파일에 실행 권한을 부여합니다.

```bash
chown user:group file.txt
```

`file.txt`의 소유자와 그룹을 변경합니다.

## 마무리

이 외에도 자주 쓰는 명령어들이 많지만, 우선 기본적으로 손에 익혀두면 좋은 것들 위주로 정리했습니다.
