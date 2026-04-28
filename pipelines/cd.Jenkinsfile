pipeline {
    agent {
        label 'slave-app'
    }

    environment {
        env.DOCKER_REPO = "yaroslavdomb/DevOps_project2"
        env.REGISTRY_CREDS_ID = 'docker-pat-token-for-proj2'
        env.CONTAINER_NAME = "my-web-app"
        env.TRACK_JOB_NAME = 'track-pipeline'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Get Image Version') {
            steps {
                script {
                    if (fileExists('version.txt')) {
                        env.IMAGE_TAG = readFile('version.txt').trim()
                        echo "Target image tag identified: ${env.IMAGE_TAG}"
                    } else {
                        error "version.txt not found! Cannot proceed with deployment."
                    }
                }
            }
        }

        stage('Pull Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDS_ID}",
                                     usernameVariable: 'REGISTRY_USER',
                                     passwordVariable: 'REGISTRY_PASS')]) {
                        sh "echo ${REGISTRY_PASS} | docker login -u ${REGISTRY_USER} --password-stdin"
                        echo "Pulling image ${env.DOCKER_REPO}:${env.IMAGE_TAG}..."
                        sh "docker pull ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
                        sh "docker logout"
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    echo "Delete old version and start new container ${env.CONTAINER_NAME}"
                    sh "docker rm -f ${env.CONTAINER_NAME} || true"
                    sh "docker run -d --name ${env.CONTAINER_NAME} -p 80:80 ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
                }
            }
        }
    }

    //The order of operations is always the same (always → changed → fixed → regression → aborted → failure → success → unstable → cleanup)
    // so it could be a trap using cleaning in always stage
    post { 
        success {
            echo "Deployment successful! Running: ${env.CONTAINER_NAME}"

            // ── Trigger Part 4: Jira Track Pipeline ──────────────────────
            script {
                def commitMsg = env.GIT_COMMIT_MESSAGE ?: 'No commit message'

                build job: "${env.TRACK_JOB_NAME}",
                      wait: false,
                      parameters: [
                          string(name: 'IMAGE_TAG', value: "${env.IMAGE_TAG}"),
                          string(name: 'COMMIT_MESSAGE', value: "${commitMsg}"),
                          string(name: 'BUILD_URL_CD', value: "${env.BUILD_URL}")
                      ]

                echo "Track pipeline triggered for ticket in: '${commitMsg}'"
            }
        }

        failure {
            echo "--------------------------------------------------------"
            echo "FAILURE in container: ${env.CONTAINER_NAME}"
            script {
                if (env.IMAGE_TAG) {
                    echo "Deployment of ${env.IMAGE_TAG} failed."
                } else {
                    echo "Deployment failed before getting image tag."
                }
            }
            echo "--------------------------------------------------------"
        }

        cleanup {
            cleanWs()
        }
    }
}