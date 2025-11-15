Pod::Spec.new do |s|
  s.name                = 'AppleMusicAuth'
  s.version             = '1.0.0'
  s.summary             = 'MusicKit authorization bridge for Chorus'
  s.homepage            = 'https://github.com/patrickmckowen/chorus'
  s.license             = { :type => 'MIT' }
  s.author              = 'Chorus'
  s.source              = { :path => '.' }
  s.platform            = :ios, '15.0'
  s.swift_version       = '5.0'
  s.source_files        = 'ios/**/*.{h,m,mm,swift}'
  s.dependency          'ExpoModulesCore'
end

