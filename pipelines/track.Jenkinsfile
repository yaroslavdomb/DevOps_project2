pipeline {
    agent any

    environment {
        JIRA_CREDS_ID = 'atlasian-pat-token-for-proj2'      
        JIRA_BASE_URL = 'https://yaroslavdomb.atlassian.net'
        JIRA_USER_EMAIL = 'yaroslav.domb@gmail.com'
        IMAGE_TAG = "${params.IMAGE_TAG ?: 'unknown'}"
        JIRA_TICKET_ID = "${params.JIRA_ID ?: ''}"
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: '', description: 'Docker image tag from CI/CD')
        string(name: 'JIRA_ID', defaultValue: '', description: 'Jira Ticket ID passed from CD')
        string(name: 'BUILD_URL_CD', defaultValue: '', description: 'CD pipeline build URL')
    }

    stages {
        stage('Extract Jira Ticket ID') {
            steps {
                script {
                    if (env.JIRA_TICKET_ID) {
                        echo "Jira ticket ID received: ${env.JIRA_TICKET_ID}"
                    } else {
                        error "No Jira ticket ID found! Expected JIRA_ID parameter."
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
                        def cdBuildLink = params.BUILD_URL_CD ?: 'N/A'
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
                        withEnv(["JSON_PAYLOAD=${commentBody}"]) {
                            def response = sh(
                                script: '''
                                    curl -s -o /tmp/jira_comment_response.json -w "%{http_code}" \\
                                    -X POST \\
                                    -u "$JIRA_USER_EMAIL:$JIRA_API_TOKEN" \\
                                    -H "Content-Type: application/json" \\
                                    "$JIRA_BASE_URL/rest/api/3/issue/$JIRA_TICKET_ID/comment" \\
                                    -d "$JSON_PAYLOAD"
                                ''',
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
        }

        stage('Close Jira Ticket') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${JIRA_CREDS_ID}", 
                                                    usernameVariable: 'JIRA_USER', 
                                                    passwordVariable: 'JIRA_API_TOKEN')]) {
                    script {
                        def transitionsResponse = sh(
                            script: '''
                                curl -s \\
                                -u "$JIRA_USER_EMAIL:$JIRA_API_TOKEN" \\
                                -H "Content-Type: application/json" \\
                                "$JIRA_BASE_URL/rest/api/3/issue/$JIRA_TICKET_ID/transitions"
                            ''',
                            returnStdout: true
                        ).trim()

                        echo "Available transitions: ${transitionsResponse}"

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

                        def closeResponse = sh(
                            script: '''
                                curl -s -o /tmp/jira_close_response.json -w "%{http_code}" \\
                                -X POST \\
                                -u "$JIRA_USER_EMAIL:$JIRA_API_TOKEN" \\
                                -H "Content-Type: application/json" \\
                                "$JIRA_BASE_URL/rest/api/3/issue/$JIRA_TICKET_ID/transitions" \\
                                -d "{\\"transition\\": {\\"id\\": \\"$TRANSITION_ID\\"}}"
                            ''',
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