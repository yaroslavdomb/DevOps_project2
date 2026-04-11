pipeline {
    agent {
        label 'slave-infra'
    }

    //let Branch Validation stage be the first stage and save me the download resources
    options {
        skipDefaultCheckout()
    }

    environment {
        env.DOCKER_REPO = "yaroslavdomb/DevOps_project2"
        env.REGISTRY_CREDS_ID = 'local-registry-credential-ID' //name that should be mentioned in Jenkins Master while configure repositiry access. Set the data inside registry 
    }

    triggers {
        // Check github each 2 minutes in random time of that period
        // Futher ngrok could be used in GitHub as Jenkins outer trigger  
        pollSCM('H/2 * * * *') 
    }

    stages {
        stage("Branch Validation") {
            steps {
                script {
                    if (env.BRANCH_NAME != 'development') {
                        error "Pipeline should only run on 'development' branch. Current branch named: ${env.BRANCH_NAME}"
                    }
                }
            }
        }
        stage('Branch Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    env.IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
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
                    sh "echo ${REGISTRY_PASS} | docker login -u ${REGISTRY_USER} --password-stdin"
                    echo "Pushing image ${env.DOCKER_REPO}:${env.IMAGE_TAG} into local Registry ..."
                    sh "docker push ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
                    sh "docker logout"
                }
            }
        }

        //optional, used to fast track deploy build number
        stage('Update Version File') {
            steps {
                withCredentials([string(credentialsId: 'github-api-token', variable: 'GITHUB_TOKEN')]) {
                    script {

                        sh "echo ${env.IMAGE_TAG} > version.txt"

                        //TODO: move the config into Jenkins CRED and get them from env vars
                        sh "git config user.email 'jenkins@example.com'"
                        sh "git config user.name 'Jenkins CI'"
                        
                        // Login into GIT with
                        sh "git remote set-url origin https://${GITHUB_TOKEN}@github.com/${env.GITHUB_USER}/${env.GITHUB_REPO}.git"
                        
                        //[skip ci] - will be parsed by Git plugin
                        sh "git add version.txt"
                        sh "git commit -m 'Release version ${env.IMAGE_TAG} [skip ci]'"
                        sh "git push origin development"
                    }
                }
            }
        }
        
        stage('Create PR to MAIN') {
            steps {
                // Для этого этапа потребуется GitHub Token, сохраненный в Jenkins
                // и установленный GitHub CLI на агенте (или использование API через curl)
                withCredentials([string(credentialsId: 'github-api-token', variable: 'GITHUB_TOKEN')]) {
                    sh """
                    curl -X POST \
                    -H "Authorization: token ${GITHUB_TOKEN}" \
                    -H "Accept: application/vnd.github.v3+json" \
                    https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/pulls \
                    -d '{"title":"Auto-PR from CI: ${IMAGE_TAG}","head":"DEV","base":"MAIN", \
                    "body":"Automated PR created by Jenkins pipeline after successful CI build."}'
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs() //could fail here if Master has no installed "Workspace Cleanup" plugin
        }

        failure {
            echo "Pipeline failed for Build #${env.BUILD_NUMBER}. Check logs at: ${env.BUILD_URL}"
        }
        
        success {
            echo "CI finished with Success for ${env.DOCKER_REPO}:${env.IMAGE_TAG}"
        }
    }
}