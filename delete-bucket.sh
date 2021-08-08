#!/bin/bash

# get buckets list => returns the timestamp + bucket name separated by lines
S3LS="$(aws s3 ls | grep 'audit-test-*')" 

# split the lines into an array. @see https://stackoverflow.com/a/13196466/6569593
oldIFS="$IFS"
IFS='
'
IFS=${IFS:0:1}
lines=( $S3LS )
IFS="$oldIFS"

for line in "${lines[@]}"
    do
        BUCKET_NAME=${line:20:${#line}} # remove timestamp
        aws s3 rb "s3://${BUCKET_NAME}" --force
done
