pipeline {
    agent {
        label 'slave-infra'
    }

    //let Branch Validation stage be the first stage and save me the download resources
    options {
        skipDefaultCheckout()
    }

    environment {
        DOCKER_REPO = "yaroslavdomb/devops_project2"
        REGISTRY_CREDS_ID = 'docker-pat-token-for-proj2'
        GITHUB_USER = 'yaroslavdomb'
        GITHUB_REPO = 'DevOps_project2'
    }

    triggers {
        // Futher ngrok could be used in GitHub as Jenkins outer trigger  
        pollSCM('* * * * *') 
    }

    stages { 
        stage("Branch Validation") {
            steps {
                script {
                    def branch = env.BRANCH_NAME ?: env.GIT_BRANCH
                    if (!branch) {
                        branch = scm.branches[0].name
                    }
                    echo "Detected branch: ${branch}"
                    if (!(branch.contains('development'))) {
                        error "Pipeline should only run on 'development' branch. Current branch: ${branch}"
                    }
                }
            }
        }

        stage('Branch Checkout') {
            steps {
                checkout scm
                script {
                    def commitMsg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    echo "Commit message: ${commitMsg}"
                    def matcher = (commitMsg =~ /([A-Z]+-\d+)/)
                    if (matcher.find()) {
                        env.JIRA_TICKET_ID = matcher[0][1]
                        echo "Found Jira Ticket: ${env.JIRA_TICKET_ID}"
                    } else {
                        echo "FATAL: No Jira Ticket ID found in commit message!"
                        error "Missing Jira Ticket ID"
                    }
                }
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = commitHash
                    if (!fileExists('app/Dockerfile')) {
                        error "Dockerfile not found in ./app directory!"
                    }
                    
                    echo "New image under construction: ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
                    sh "docker build -t ${env.DOCKER_REPO}:${env.IMAGE_TAG} ./app"
                }
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDS_ID}", 
                                                usernameVariable: 'REGISTRY_USER', 
                                                passwordVariable: 'REGISTRY_PASS')]) {
                    script {
                        def dockerConfigDir = "${WORKSPACE}/.docker-tmp-${env.BUILD_NUMBER}"
                        sh "mkdir -p ${dockerConfigDir}"

                        withEnv(["DOCKER_CONFIG=${dockerConfigDir}"]) {
                            sh 'echo "${REGISTRY_PASS}" | docker login -u ${REGISTRY_USER} --password-stdin'
                            echo "Pushing image ${env.DOCKER_REPO}:${env.IMAGE_TAG} into Registry ..."
                            sh "docker push ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
                            sh "docker logout"
                        }
                        sh "rm -rf ${dockerConfigDir}"
                    }
                }
            }
        }

        stage('Create PR to MAIN') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-api-pat-token-for-proj2', 
                                                passwordVariable: 'GITHUB_TOKEN', 
                                                usernameVariable: 'GITHUB_USER_UNUSED')]) {
                    script {
                        def pullReqTitle = "Auto-PR from CI: ${env.IMAGE_TAG} [${env.JIRA_TICKET_ID}]"
                        def pullReqBody = "Automated PR created by Jenkins pipeline after successful CI build."
                        
                        // s = prevent progress table appearence in the Jenkins log
                        // o /dev/null = redirect output to null (as we need only response code) 
                        // w "%{http_code}" = write returned code
                        def response = sh(
                            script: """
                                curl -s -o /dev/null -w "%{http_code}" -X POST \
                                -H "Authorization: token ${GITHUB_TOKEN}" \
                                -H "Accept: application/vnd.github.v3+json" \
                                https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/pulls \
                                -d '{"title":"${pullReqTitle}", "head":"development", "base":"main", "body":"${pullReqBody}"}'
                            """,
                            returnStdout: true
                        ).trim()

                        def successCodes = ["200", "201", "204"]
                        if (successCodes.contains(response)) {
                            echo "Successfully created a new PR."
                        } else if (response == "422") {
                            echo "PR already exists. Existing PR will be updated automatically by git push."
                        } else {
                            error "GitHub API returned error ${response}. Failed to create PR."
                        }
                    }
                }
            }
        }
    }

    //The order of operations is always the same:
    // always → changed → fixed → regression → aborted → failure → success → unstable → cleanup
    // so it could be a trap using cleaning in always stage
    post {
        failure {
            echo "Pipeline failed for Build #${env.BUILD_NUMBER}. Check logs at: ${env.BUILD_URL}"
        }
        
        success {
            echo "CI finished with Success for ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
        }

        cleanup {
            script {
                // delete local image after push
                if (env.IMAGE_TAG) {
                    echo "Cleaning up local image: ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
                    sh "docker rmi ${env.DOCKER_REPO}:${env.IMAGE_TAG} || true"
                } else {
                    echo "IMAGE_TAG was not defined (pipeline might have failed early). Skipping docker rmi."
                }

                //
                cleanWs()
            }
        }
    }
}