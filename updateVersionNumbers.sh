#!/usr/bin/env bash

LAST_WEEKS_TAG=$(ruby -e 'now = Time.now - 604800; puts now.strftime("%Y-w%V-rc1")')
THIS_WEEKS_TAG=$(ruby -e 'puts Time.now.strftime("%Y-w%V-rc1")')

FILES_WITH_VERSION_NUMBERS=("package.json" "releasenotes.md" "config/environment.js")

function replaceInFile(){
    textToFind=${1}
    textToReplace=${2}
    fileName=${3}

    echo "replacing $textToFind with $textToReplace in $fileName"
    sed -e "s/$textToFind/$textToReplace/g" -i "" ${fileName}
}

for FILE in "${FILES_WITH_VERSION_NUMBERS[@]}"
do
    replaceInFile ${LAST_WEEKS_TAG} ${THIS_WEEKS_TAG} ${FILE}
done
