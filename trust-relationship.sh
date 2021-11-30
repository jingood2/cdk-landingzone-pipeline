

## 1.cdk-assume-role-credential-plugin 작업
#export AWS_PROFILE=logging-administrator
npx cdk bootstrap \ 
--profile logging-administrator \ 
--trust 037729278610 \ 
--cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \ 
aws://318126949465/ap-northeast-2

## 2. 

## 2. environment variable 에 계정 정보 추가

## 3. 