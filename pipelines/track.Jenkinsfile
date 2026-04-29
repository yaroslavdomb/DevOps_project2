pipeline {
    agent any

    environment {
        JIRA_CREDS_ID = 'atlasian-pat-token-for-proj2'      
        JIRA_BASE_URL = 'https://yaroslavdomb.atlassian.net'
        JIRA_USER_EMAIL = 'yaroslav.domb@google.com'
        IMAGE_TAG = "${params.IMAGE_TAG ?: 'unknown'}"
        GIT_COMMIT_MSG = "${params.COMMIT_MESSAGE ?: ''}"
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: '', description: 'Docker image tag from CI/CD')
        string(name: 'COMMIT_MESSAGE', defaultValue: '', description: 'Last git commit message')
        string(name: 'BUILD_URL_CD', defaultValue: '', description: 'CD pipeline build URL')
    }

    stages {
        stage('Extract Jira Ticket ID') {
            steps {
                script {
                    def commitMsg = env.GIT_COMMIT_MSG?.trim()

                    if (!commitMsg) {
                        error "COMMIT_MESSAGE parameter is empty. CD pipeline must pass the commit message."
                    }

                    echo "Commit message received: '${commitMsg}'"

                    def matcher = commitMsg =~ /[A-Z][A-Z0-9]+-\d+/
                    if (matcher) {
                        env.JIRA_TICKET_ID = matcher[0]
                        echo "Jira ticket ID extracted: ${env.JIRA_TICKET_ID}"
                    } else {
                        error "No Jira ticket ID found in commit message: '${commitMsg}'\n" +
                              "Expected format: PROJ-123 somewhere in the message."
                    }
                }
            }
        }

        stage('Add Deployment Comment to Jira') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${JIRA_CREDS_ID}", 
                                                    usernameVariable: 'JIRA_USER', 
                                                    passwordVariable: 'JIRA_API_TOKEN')]) {
                    script {
                        def cdBuildLink = env.BUILD_URL_CD ?: 'N/A'
                        def commentBody = """
{
  "body": {
    "version": 1,
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Deployment completed successfully by Jenkins.",
            "marks": [{ "type": "strong" }]
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Image tag: " },
          { "type": "text", "text": "${env.IMAGE_TAG}", "marks": [{ "type": "code" }] }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "CD Build: ${cdBuildLink}" }
        ]
      }
    ]
  }
}
"""
                        def response = sh(
                            script: """
                                curl -s -o /tmp/jira_comment_response.json -w "%{http_code}" \\
                                -X POST \\
                                -u "${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}" \\
                                -H "Content-Type: application/json" \\
                                "${JIRA_BASE_URL}/rest/api/3/issue/${env.JIRA_TICKET_ID}/comment" \\
                                -d '${commentBody}'
                            """,
                            returnStdout: true
                        ).trim()

                        echo "Jira API response code: ${response}"
                        def responseBody = readFile('/tmp/jira_comment_response.json')
                        echo "Jira response body: ${responseBody}"

                        if (!response.startsWith('2')) {
                            error "Failed to add comment to Jira ticket ${env.JIRA_TICKET_ID}. HTTP: ${response}"
                        }

                        echo "Comment added to ${env.JIRA_TICKET_ID} successfully."
                    }
                }
            }
        }

        stage('Close Jira Ticket') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${JIRA_CREDS_ID}", 
                                                    usernameVariable: 'JIRA_USER', 
                                                    passwordVariable: 'JIRA_API_TOKEN')]) {
                    script {
                        // Шаг 1: получить доступные transitions для тикета
                        def transitionsResponse = sh(
                            script: """
                                curl -s \\
                                -u "${env.JIRA_USER_EMAIL}:${JIRA_API_TOKEN}" \\
                                -H "Content-Type: application/json" \\
                                "${JIRA_BASE_URL}/rest/api/3/issue/${env.JIRA_TICKET_ID}/transitions"
                            """,
                            returnStdout: true
                        ).trim()

                        echo "Available transitions: ${transitionsResponse}"

                        // Шаг 2: найти transition ID для статуса "Done"
                        // Парсим JSON через groovy — ищем "Done" или "Closed"
                        def transitionsJson = readJSON text: transitionsResponse
                        def doneTransition = transitionsJson.transitions.find { t ->
                            t.name?.toLowerCase() in ['done', 'closed', 'close', 'resolve', 'resolved']
                        }

                        if (!doneTransition) {
                            echo "WARNING: Could not find 'Done' transition for ${env.JIRA_TICKET_ID}."
                            echo "Available transitions: ${transitionsJson.transitions.collect { it.name }}"
                            echo "Skipping auto-close. Close the ticket manually."
                            return
                        }

                        env.TRANSITION_ID = doneTransition.id
                        echo "Found 'Done' transition ID: ${env.TRANSITION_ID} (name: ${doneTransition.name})"

                        // Шаг 3: выполнить transition → статус Done
                        def closeResponse = sh(
                            script: """
                                curl -s -o /tmp/jira_close_response.json -w "%{http_code}" \\
                                -X POST \\
                                -u "${env.JIRA_USER_EMAIL}:${JIRA_API_TOKEN}" \\
                                -H "Content-Type: application/json" \\
                                "${JIRA_BASE_URL}/rest/api/3/issue/${env.JIRA_TICKET_ID}/transitions" \\
                                -d '{"transition": {"id": "${env.TRANSITION_ID}"}}'
                            """,
                            returnStdout: true
                        ).trim()

                        echo "Close transition HTTP code: ${closeResponse}"

                        if (closeResponse == '204' || closeResponse == '200') {
                            echo "Jira ticket ${env.JIRA_TICKET_ID} moved to Done."
                        } else {
                            def closeBody = readFile('/tmp/jira_close_response.json')
                            echo "Unexpected response closing ticket: ${closeResponse} — ${closeBody}"
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Track pipeline completed. Ticket ${env.JIRA_TICKET_ID} updated and closed."
        }
        failure {
            echo "Track pipeline failed. Ticket: ${env.JIRA_TICKET_ID ?: 'not extracted'}"
        }
        cleanup {
            sh 'rm -f /tmp/jira_comment_response.json /tmp/jira_close_response.json || true'
        }
    }
}
