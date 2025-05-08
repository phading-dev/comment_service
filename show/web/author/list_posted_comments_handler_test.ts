import "../../../local/env";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import {
  deleteCommentStatement,
  insertCommentStatement,
} from "../../../db/sql";
import { ListPostedCommentsHandler } from "./list_posted_comments_handler";
import { LIST_POSTED_COMMENTS_RESPONSE } from "@phading/comment_service_interface/show/web/author/interface";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListPostedCommentsHandlerTest",
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
              pinnedVideoTimeMs: 60,
            }),
            insertCommentStatement({
              commentId: "comment3",
              authorId: "account1",
              seasonId: "season3",
              episodeId: "episode3",
              content: "content3",
              postedTimeMs: 3000,
              pinnedVideoTimeMs: 120,
            }),
            insertCommentStatement({
              commentId: "comment2",
              authorId: "account1",
              seasonId: "season2",
              episodeId: "episode2",
              content: "content2",
              postedTimeMs: 2000,
              pinnedVideoTimeMs: 180,
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new ListPostedCommentsHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => 4000,
        );

        {
          // Execute
          let response = await handler.handle(
            "",
            {
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
                    commentId: "comment3",
                    seasonId: "season3",
                    episodeId: "episode3",
                    content: "content3",
                    postedTimeMs: 3000,
                    pinnedVideoTimeMs: 120,
                  },
                  {
                    commentId: "comment2",
                    seasonId: "season2",
                    episodeId: "episode2",
                    content: "content2",
                    postedTimeMs: 2000,
                    pinnedVideoTimeMs: 180,
                  },
                ],
                postedTimeCursor: 2000,
              },
              LIST_POSTED_COMMENTS_RESPONSE,
            ),
            "response",
          );
        }

        {
          // Execute
          let response = await handler.handle(
            "",
            {
              limit: 2,
              postedTimeCursor: 2000,
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
                    seasonId: "season1",
                    episodeId: "episode1",
                    content: "content1",
                    postedTimeMs: 1000,
                    pinnedVideoTimeMs: 60,
                  },
                ],
              },
              LIST_POSTED_COMMENTS_RESPONSE,
            ),
            "response",
          );
        }
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteCommentStatement({ commentCommentIdEq: "comment1" }),
            deleteCommentStatement({ commentCommentIdEq: "comment2" }),
            deleteCommentStatement({ commentCommentIdEq: "comment3" }),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
