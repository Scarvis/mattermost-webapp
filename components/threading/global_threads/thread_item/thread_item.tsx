// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useCallback, useEffect, MouseEvent} from 'react';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';
import {useSelector, useDispatch} from 'react-redux';

import {makeGetChannel} from 'mattermost-redux/selectors/entities/channels';
import {getChannel as fetchChannel} from 'mattermost-redux/actions/channels';
import {getUser, makeGetDisplayName} from 'mattermost-redux/selectors/entities/users';
import {getProfilesByIds} from 'mattermost-redux/actions/users';
import {getThread} from 'mattermost-redux/selectors/entities/threads';
import {getPost} from 'mattermost-redux/selectors/entities/posts';
import {UserThread} from 'mattermost-redux/types/threads';
import {$ID} from 'mattermost-redux/types/utilities';

import './thread_item.scss';

import Badge from 'components/widgets/badges/badge';
import Timestamp from 'components/timestamp';
import Avatars from 'components/widgets/users/avatars';
import Button from 'components/threading/common/button';
import SimpleTooltip from 'components/widgets/simple_tooltip';

import Markdown from 'components/markdown';

import ThreadMenu from '../thread_menu';

import {THREADING_TIME} from '../../common/options';
import {GlobalState} from 'types/store';
import {useThreadRouting} from '../../hooks';
import {UserProfile} from '../../../../../mattermost-mobile/app/mm-redux/types/users';
import {imageURLForUser} from 'utils/utils';

type Props = {
    threadId: $ID<UserThread>;
    isSelected: boolean;
};

const getDisplayName = makeGetDisplayName();
const getChannel = makeGetChannel();

const markdownPreviewOptions = {
    singleline: true,
    mentionHighlight: false,
    atMentions: false,
};

const ThreadItem = ({
    threadId,
    isSelected,
}: Props) => {
    const {select, goToInChannel} = useThreadRouting();
    const dispatch = useDispatch();

    const thread = useSelector((state: GlobalState) => getThread(state, threadId));

    if (!thread) {
        return null;
    }

    const {
        unread_replies: newReplies,
        unread_mentions: newMentions,
        last_reply_at: lastReplyAt,
        reply_count: totalReplies,
        is_following: isFollowing,
        participants,
        post: {
            channel_id: channelId,
            user_id: userId,
            message,
        },
    } = thread;
    const channel = useSelector((state: GlobalState) => getChannel(state, {id: channelId}));

    useEffect(() => {
        if (!channel) {
            dispatch(fetchChannel(channelId));
        }
    }, [channel, channelId]);

    const displayName = useSelector((state: GlobalState) => getDisplayName(state, userId, true));

    return (
        <article
            className={classNames('ThreadItem', {
                'has-unreads': newReplies,
                'is-selected': isSelected,
            })}
            tabIndex={0}
            onClick={useCallback(() => select(threadId), [threadId])}
        >
            <h1>
                {Boolean(newMentions || newReplies) && (
                    <div className='indicator'>
                        {newMentions ? (
                            <div className={classNames('dot-mentions', {over: newMentions > 99})}>
                                {Math.min(newMentions, 99)}
                                {newMentions > 99 && '+'}
                            </div>
                        ) : (
                            <div className='dot-unreads'/>
                        )}
                    </div>
                )}
                <span>{displayName}</span>
                {Boolean(channel) && (
                    <Badge
                        onClick={useCallback((e: MouseEvent) => {
                            e.stopPropagation();
                            goToInChannel(threadId);
                        }, [history])}
                    >
                        {channel.display_name}
                    </Badge>
                )}
                <Timestamp
                    {...THREADING_TIME}
                    className='alt-hidden'
                    value={lastReplyAt}
                    capitalize={true}
                />
            </h1>
            <span className='menu-anchor alt-visible'>
                <ThreadMenu
                    threadId={threadId}
                    isSaved={false}
                    isFollowing={isFollowing ?? false}
                    hasUnreads={Boolean(newReplies)}
                >
                    <SimpleTooltip
                        id='threadActionMenu'
                        content={(
                            <FormattedMessage
                                id='threading.threadItem.menu'
                                defaultMessage='Actions'
                            />
                        )}
                    >
                        <Button className='Button___icon'>
                            <i className='Icon icon-dots-vertical'/>
                        </Button>
                    </SimpleTooltip>
                </ThreadMenu>
            </span>
            <div className='preview'>
                <Markdown
                    message={message}
                    options={markdownPreviewOptions}
                />
            </div>
            {Boolean(totalReplies) && (
                <div className='activity'>
                    <Avatars
                        users={participants.map((user) => {
                            return {
                                username: (user as UserProfile).username,
                                name: `${(user as UserProfile).first_name} ${(user as UserProfile).last_name}`,
                                url: imageURLForUser(user.id, (user as UserProfile).last_picture_update),
                            };
                        })}
                        totalUsers={0}
                        size='xs'
                    />
                    {newReplies ? (
                        <FormattedMessage
                            id='threading.numNewReplies'
                            defaultMessage='{newReplies, plural, =1 {# new reply} other {# new replies}}'
                            values={{newReplies}}
                        />
                    ) : (
                        <FormattedMessage
                            id='threading.numReplies'
                            defaultMessage='{totalReplies, plural, =0 {Reply} =1 {# reply} other {# replies}}'
                            values={{totalReplies}}
                        />
                    )}
                </div>
            )}
        </article>
    );
};

export default memo(ThreadItem);
