pipeline {
    agent {
        label 'slave-app'
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: '', description: 'Docker image tag to deploy')
    }

    triggers {
        pollSCM('* * * * *') 
    }

    environment {
        DOCKER_REPO = "yaroslavdomb/devops_project2"
        REGISTRY_CREDS_ID = 'docker-pat-token-for-proj2'
        CONTAINER_NAME = "my-web-app"
        TRACK_JOB_NAME = 'track-pipeline'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Identify Version') {
            steps {
                script {
                    def tag = sh(script: "git show -s --format='%p' HEAD | awk '{print \$2}' | cut -c1-7", returnStdout: true).trim()
                    
                    if (tag == "") {
                        tag = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    }
                    
                    env.FINAL_TAG = tag
                    echo "Target image tag identified from Git history: ${env.FINAL_TAG}"
                }
            }
        }

        stage('Extract Jira Ticket') {
            steps {
                script {
                    def commitMsg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    def matcher = (commitMsg =~ /\[([A-Z0-9]+-\d+)\]/)
                    if (matcher.find()) {
                        env.EXTRACTED_JIRA_ID = matcher[0][1]
                        echo "Extracted Jira ID: ${env.EXTRACTED_JIRA_ID}"
                    } else {
                        echo "No Jira ID found in commit message."
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
                        def dockerConfigDir = "${WORKSPACE}/.docker-config-${env.BUILD_NUMBER}"
                        sh "mkdir -p ${dockerConfigDir}"
                        withEnv(["DOCKER_CONFIG=${dockerConfigDir}"]) {
                            sh 'echo "$REGISTRY_PASS" | docker login -u $REGISTRY_USER --password-stdin'
                            echo "Pulling image ${env.DOCKER_REPO}:${env.FINAL_TAG}..."
                            sh "docker pull ${env.DOCKER_REPO}:${env.FINAL_TAG}"
                            sh 'docker logout'
                        }
                        sh "rm -rf ${dockerConfigDir}"
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    echo "Replacing old container ${env.CONTAINER_NAME} with version ${env.FINAL_TAG}"
                    sh "docker rm -f ${env.CONTAINER_NAME} || true"
                    sh "docker run -d --name ${env.CONTAINER_NAME} -p 8092:80 ${env.DOCKER_REPO}:${env.FINAL_TAG}"
                }
            }
        }
    }

    // The order of operations is always the same:
    // always → changed → fixed → regression → aborted → failure → success → unstable → cleanup
    // so it could be a trap using cleaning in always stage
    post { 
        success {
            echo "Deployment successful! Running: ${env.CONTAINER_NAME}"

            script {
                if (env.EXTRACTED_JIRA_ID) {
                    build job: "${env.TRACK_JOB_NAME}",
                        wait: false,
                        parameters: [
                            string(name: 'IMAGE_TAG', value: "${env.FINAL_TAG}"),
                            string(name: 'JIRA_ID', value: "${env.EXTRACTED_JIRA_ID}"),
                            string(name: 'BUILD_URL_CD', value: "${env.BUILD_URL}")
                        ]
                    echo "Track pipeline triggered for ticket in: '${env.EXTRACTED_JIRA_ID}'"
                }
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