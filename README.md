#Motocal client

##Release
The release script is run via cron as specified in the crontab from the [rs-utilities](https://bitbucket.org/rocksteady-technology/rs-utilities) repo

From the client repo do the following example for '2017-w14-rc1':

1. Start the release
```
  git checkout  develop
  git pull
  git push
  ruby -e 'puts Time.now.strftime("%Y-w%V-rc1")'
  git flow release start 2017-w14-rc1
```

2. Bump the version number and compile the release notes (Update releasenotes.md)
 
3. Commit the updated files
```
  git commit -m "2017-w14-rc1 Update version number, update releasenotes.md"
```

4. Finish the release
```
  git push
  git flow release finish '2017-w14-rc1'
  git push
  git push --tags
  git checkout master
  git push 
  git push --tags
```

##Recommended System Configuration
Node v6.10.3
NPM 6.0.1
Sass 3.4.22 (Selective Steve)

##Setup
The build tool used is ember-cli. You may want to familiarise yourself with the
[ember-cli documentation](http://www.ember-cli.com/).

From the 'client' directory, install ember-cli:
```
npm install -g ember-cli
```
*That will install it globally (-g). In case you want to install it locally, just avoid the -g. The bin file that would reference the command ember is in ./node_modules/ember-cli/bin/ember.

Install bower:
```
npm install -g bower
```
Install client packages:
```
rm -rf node_modules
rm -rf bower_components
npm install
bower install
```

##Build a Distribution Package
There are 3 build types : 
* development
* test
* production

Build them as follows:
ember build
ember build --environment test
ember build --environment production

##Dev Server
Run ember server:
```
ember server
```

##Troubleshooting
[Debian] Install package dependencies:
```
apt-get install coffeescript libcairo-dev libjpeg-dev libgif-dev
```
[OSX] If you get an error about Cairo or libjpeg, try this:
```
xcode-select --install
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:/opt/X11/lib/pkgconfig
npm install
```
[OSX] If you get an error about too many open files:
```
sysctl kern.maxfiles
kern.maxfiles: 12288
sysctl kern.maxfilesperproc
kern.maxfilesperproc: 10240
sudo sysctl -w kern.maxfiles=1048600
kern.maxfiles: 12288 -> 1048600
sudo sysctl -w kern.maxfilesperproc=1048576
kern.maxfilesperproc: 10240 -> 1048576
ulimit -S -n
256
ulimit -S -n 1048576
ulimit -S -n
1048576
```
[OSX] `Build failed. spawn gm ENOENT'
```
brew install graphicsmagick
```
[Ubuntu] `Build failed. spawn gm ENOENT'
```
sudo add-apt-repository ppa:dhor/myway
sudo apt-get update
sudo apt-get install graphicsmagick
```
##Run the Automation Tests
Automation tests are now in the ranelagh (Integration tests, migrating to motocal-test-ware) repo and the motocal-test-ware repo (User acceptance).
