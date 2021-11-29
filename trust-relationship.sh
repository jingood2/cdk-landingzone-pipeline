#export AWS_PROFILE=logging-administrator
npx cdk bootstrap \ 
--profile logging-administrator \ 
--trust 037729278610 \ 
--cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \ 
aws://318126949465/ap-northeast-2