import "../../../local/env";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import {
  deleteCommentStatement,
  insertCommentStatement,
} from "../../../db/sql";
import { ListCommentsHandler } from "./list_comments_handler";
import { LIST_COMMENTS_RESPONSE } from "@phading/comment_service_interface/show/web/reader/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListCommentsHandlerTest",
  cases: [
    {
      name: "ListOneBatch_ListWithNoMore",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertCommentStatement({
              commentId: "comment1",
              authorId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content1",
              postedTimeMs: 1000,
              pinTimeMs: 60,
            }),
            insertCommentStatement({
              commentId: "comment2",
              authorId: "account2",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content2",
              postedTimeMs: 2000,
              pinTimeMs: 180,
            }),
            insertCommentStatement({
              commentId: "comment3",
              authorId: "account3",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content3",
              postedTimeMs: 3000,
              pinTimeMs: 120,
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new ListCommentsHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        {
          // Execute
          let response = await handler.handle(
            "",
            {
              seasonId: "season1",
              episodeId: "episode1",
              limit: 2,
            },
            "auth",
          );

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                comments: [
                  {
                    commentId: "comment1",
                    authorId: "account1",
                    content: "content1",
                    pinTimeMs: 60,
                  },
                  {
                    commentId: "comment3",
                    authorId: "account3",
                    content: "content3",
                    pinTimeMs: 120,
                  },
                ],
                pinTimeCursor: 120,
              },
              LIST_COMMENTS_RESPONSE,
            ),
            "response 1",
          );
        }

        {
          // Execute
          let response = await handler.handle(
            "",
            {
              seasonId: "season1",
              episodeId: "episode1",
              pinTimeCursor: 120,
              limit: 2,
            },
            "auth",
          );

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                comments: [
                  {
                    commentId: "comment2",
                    authorId: "account2",
                    content: "content2",
                    pinTimeMs: 180,
                  },
                ],
              },
              LIST_COMMENTS_RESPONSE,
            ),
            "response 2",
          );
        }
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteCommentStatement("comment1"),
            deleteCommentStatement("comment2"),
            deleteCommentStatement("comment3"),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
