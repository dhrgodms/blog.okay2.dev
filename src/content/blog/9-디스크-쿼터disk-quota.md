---
title: "9. 디스크 쿼터(Disk Quota)"
description: "리눅스의 디스크 쿼터에 대해 알아본다."
category: "Linux"
pubDate: "Aug 27 2026"
---

# 1. 디스크 쿼터
> 사용자, 그룹 별로 디스크 사용량을 제한하여 여러 사용자가 공유하는 서버에서 디스크를 독점하는 것을 방지하기 위한 기능이다. 디스크 쿼터의 대상은 파일/디렉토리가 아니라 **파일 시스템 단위**가 된다.

### 종류
디스크 사용을 제한하는 방식은 어떤 것을 기준으로 제한하느냐에 따라 크게 두 가지로 나눈다.

- 블록 쿼터: 사용할 수 있는 **디스크 용량**을 제한
- 아이노드 쿼터: 생성할 수 있는 **파일 개수**를 제한
	- 아이노드 하나 = 파일 하나로 취급 ([10. 리눅스의 inode](/blog/10-inode별-세개/) 참고)


### 디스크 쿼터 초과에 대한 경고/알림들
- soft limit: 경고만 발생. `grace period`동안 유예.
	- grace period: soft limit 초과 ~ hard limit 미만까지 허용되는 유예 기간(기본 7일)
- hard limit: 절대 초과 불가능한 한계치로, 도달 즉시 쓰기가 차단된다.


# 2. 쿼터 지정/해제
## 2.1. 파일 시스템 마운트 옵션에 쿼터 옵션 추가

쿼터 옵션은 두 가지가 있다.
- `usrquota`: 사용자별 쿼터 적용
- `grpquota`: 그룹별 쿼터 적용

### 2.1.1. 현재 쿼터 옵션 확인
```bash
cat /etc/fstab

/dev/vdb1 /home ext4 defaults 0 0 -- 이런 결과가 나왔다고 가정.
```
- docker로 띄운 ubuntu에서는 `# UNCONFIGURED FSTAB FOR BASE SYSTEM` 결과를 볼 수 있었다.
	- docker 컨테이너나 클라우드 이미지는 `/` 자체가 오버레이 파일 시스템으로 마운트되어 fstab을 아예 안쓴다.

위 결과를 본다고 하면, 현재 /home이 vdb1에 마운트되어있다고 할 수 있다.
`defaults`가 바로 쿼터 옵션이 된다. defaults말고는 위에서 말한 쿼터 옵션이 없기 때문에 기본으로 설정되어있음을 알 수 있다.


### 2.1.2.  `/etc/fstab` 편집
옵션 필드에 콤마로 옵션을 띄어쓰기 없이 이어붙이면 된다.
```bash
vi /etc/fstab
```

![](../../assets/blog/9-디스크-쿼터disk-quota/Pasted%20image%2020260827230126.png)

파일 시스템 마운트 옵션에 쿼터 옵션을 추가한다.

### 2.1.3. 재마운트 = 즉시 적용
fstab을 수정했다면, **다시 마운트해줘야 커널이 새 옵션을 인식할 수 있게 된다**.
```bash
mount -o remount /home
```



### 2.1.4. 잘 적용되었는지 확인
```bash
mount | grep /home
```

## 2.2. 마운트된 쿼터 끄기 `quotaoff` 
```bash
quotaoff -augp
```
`-a` 옵션으로 인해 특정 파일시스템(home)이 아니라, `/etc/fstab`에 쿼터 옵션이 설정된 모든 파일시스템에 대해 디스크 쿼터 기능을 해제하는 명령어이다.

## 2.3. 쿼터 점검, 데이터베이스 파일 생성 `quotacheck` 
> 파일 시스템을 스캔해서 각 사용자/그룹이 현재 얼마나 쓰고 있는지 계산하고,
> 그 결과를 `aquota.user`, `aquota.group` 파일을 (없으면) 생성하여 기록한다.


```bash
quotacheck -augmn
```

- 쿼터에 대해 다시 계산할 때도 사용한다(동기화).

#### options
위 옵션(`-augp`, `-augmn`)들은 각각 아래와 같은 역할을 한다.

`-a`: fstab에 등록된 모든 대상을 검사한다.
`-v`: 진행 상황을 출력한다. (verbose)
`-u`: 사용자 쿼터 검사
`-g`: 그룹 쿼터 검사
`-m`: 마운트된 상태에서 강제 실행(재마운트 생략)
`-p`: 처리 결과 출력
`-n`: 첫번째 검색된 것 사용


### 2.3.1. 쿼터 서비스 활성화 `quotaon` 
> `quotacheck`를 통해 만든 데이터베이스 파일을 근거로 커널에서 쿼터 제한 감시를 활성화하는 명령어이다.


## 2.4. 사용자별 쿼터 지정 `edquota`
> 편집기를 통해 사용자/그룹에 디스크 사용량을 할당하는 명령어.

- 자동으로 편집기가 열린다.

예를 들어,
```bash
edquota -u ok2
```
를 실행하면, vi가 열린다. 

```
Disk quotas for user ok2 (uid 1001):
  Filesystem                   blocks   soft   hard   inodes   soft   hard
  /dev/vdb1                      1200      0      0       15      0      0
```
- blocks: 현재 사용 중인 용량 (KB단위)
	- readonly
- blocks soft/hard: 용량 제한 값(KB단위)
- inodes: 현재 사용 중인 파일 개수
	- readonly
- inodes soft/hard: 파일 개수 제한 값

제한을 주고 싶은 방식에 따라 blocks, inodes를 선택하여 soft/hard limit을 주고 저장하면 된다.

#### options
`-u` 사용자
`-g` 그룹
`-t` 할당량 유예기간 (`edquota -t`를 통해 유예 기간을 보거나 수정 가능.)
`-p` 다른 사용자와 동일하게 설정 (`edquota -p ok2 user1 user2 user3`처럼 ok2(기준)의 디스크 쿼터를 다른 사용자에게도 동일하게 적용)


> `setquota`를 통해 명령행에서 직접 사용자/그룹에게 디스크 사용량을 할당할 수도 있다.

---
## 관련 글
- [10. 리눅스의 inode](/blog/10-inode별-세개/) — 아이노드 쿼터가 세는 대상, inode
- [8. 리눅스의 권한과 그룹](/blog/8-리눅스의-권한과-그룹/) — 사용자/그룹 개념
- [5. 마운트와 바인드](/blog/5-마운트와-바인드/) — fstab, remount 개념
