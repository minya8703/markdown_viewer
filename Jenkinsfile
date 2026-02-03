// Markdown Viewer V2 - Jenkins Pipeline
// 빌드 → 테스트 → (선택) 아티팩트 보관
// 사용: Jenkins에서 "Pipeline from SCM" 선택 후 이 파일 지정

pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeep: 20))
  }

  stages {
    stage('Frontend') {
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm run type-check'
          sh 'npm run test:run'
          sh 'npm run build'
        }
      }
      post {
        success {
          stash name: 'frontend-dist', includes: 'frontend/dist/**'
        }
      }
    }

    stage('Backend') {
      steps {
        dir('backend') {
          sh 'chmod +x gradlew'
          sh './gradlew test --no-daemon'
          sh './gradlew build -x test --no-daemon'
        }
      }
      post {
        success {
          stash name: 'backend-jar', includes: 'backend/build/libs/**'
        }
      }
    }
  }

  post {
    always {
      cleanWs(deleteDirs: true, patterns: [[pattern: 'node_modules', type: 'INCLUDE']])
    }
    success {
      echo '빌드·테스트 성공. stash에 frontend-dist, backend-jar 보관됨.'
    }
    failure {
      echo '빌드 또는 테스트 실패.'
    }
  }
}
