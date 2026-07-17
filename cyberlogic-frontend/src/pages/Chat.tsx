import { useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";

// Modular sub-components
import ChannelSidebar from "../components/chat/ChannelSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import MessageStream from "../components/chat/MessageStream";
import MessageInput from "../components/chat/MessageInput";
import EmojiSearchPicker from "../components/chat/EmojiSearchPicker";
import DeleteMessageModal from "../components/chat/DeleteMessageModal";
import MembersList from "../components/chat/MembersList";
import { useSEO } from "../utils/useSEO";

export default function Chat() {
  useSEO({
    title: "Realtime Chat",
    description: "Connect and collaborate with other members of Cyberlogic Club in realtime chat rooms.",
  });

  const {
    isConnected,
    currentUser,
    allUsers,
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    messageText,
    setMessageText,
    readReceipts,
    hasMoreMessages,
    isFetchingMoreMessages,
    hasNewerMessages,
    isFetchingNewerMessages,
    replyingTo,
    setReplyingTo,
    showChatEditorEmojiPicker,
    setShowChatEditorEmojiPicker,
    channelsLoading,
    messagesLoading,
    typingUsers,
    jumpToId,
    setJumpToId,
    isJumpingToMessage,
    toastMessage,
    triggerToast,
    activeChannelData,
    hasWritePermission,
    canDeleteMessages,
    handleInputChange,
    handleSendMessage,
    handleSelectGif,
    handleToggleEmoji,
    handleConfirmDelete,
    handleEditMessage,
    loadMoreHistory,
    loadNewerHistory,
    jumpToMessage,
    jumpToPresent,
    onlineUsers,
    deletingMessage,
    setDeletingMessage,
    handleDeleteClick,
    unreadStatus,
    startDm,
    createGroupChat,
  } = useChat();

  const [showMobileChannels, setShowMobileChannels] = useState(false);
  const [showMembersList, setShowMembersList] = useState(window.innerWidth >= 1024);

  // Reaction states
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<number | null>(null);
  const [activeFullPickerMessageId, setActiveFullPickerMessageId] = useState<number | null>(null);

  // Close reaction picker on click-away / touch-away
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".reaction-picker-container") && !target.closest(".reaction-trigger-btn")) {
        setActiveReactionPickerMessageId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, []);

  const collapsedGroupsState = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = collapsedGroupsState;

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-950">
      {/* Toast alert for errors */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-error/95 border border-error/50 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      <DeleteMessageModal
        isOpen={deletingMessage !== null}
        deletingMessage={deletingMessage}
        onClose={() => setDeletingMessage(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Mobile Drawer */}
      {showMobileChannels && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileChannels(false)}
          />

          <div className="relative flex w-64 max-w-xs flex-col bg-surface-900 border-r border-border animate-slideRight">
            <ChannelSidebar
              channels={channels}
              activeChannel={activeChannel}
              setActiveChannel={setActiveChannel}
              channelsLoading={channelsLoading}
              onlineUsers={onlineUsers as any}
              isConnected={!!isConnected}
              onChannelSelect={() => setShowMobileChannels(false)}
              collapsedGroups={collapsedGroups}
              setCollapsedGroups={setCollapsedGroups}
              className="flex flex-col h-full w-full"
              unreadStatus={unreadStatus}
              startDm={startDm}
              createGroupChat={createGroupChat}
              allUsers={allUsers}
            />
          </div>
        </div>
      )}

      {/* Mobile/Tablet Members Drawer */}
      {showMembersList && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMembersList(false)}
          />

          <div className="relative flex w-60 max-w-xs flex-col bg-surface-900 border-l border-border animate-slideLeft h-full">
            <MembersList
              onlineUsers={onlineUsers as any}
              onClose={() => setShowMembersList(false)}
              showCloseButton={true}
            />
          </div>
        </div>
      )}

      {/* Desktop Channel Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        channelsLoading={channelsLoading}
        onlineUsers={onlineUsers as any}
        isConnected={!!isConnected}
        collapsedGroups={collapsedGroups}
        setCollapsedGroups={setCollapsedGroups}
        unreadStatus={unreadStatus}
        startDm={startDm}
        createGroupChat={createGroupChat}
        allUsers={allUsers}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          activeChannelData={activeChannelData}
          onOpenMobileMenu={() => setShowMobileChannels(true)}
          showMembersList={showMembersList}
          onToggleMembersList={() => setShowMembersList((prev) => !prev)}
        />

        <div className="flex-1 flex min-h-0 relative">
          {/* Full emoji picker popup overlay */}
          {activeFullPickerMessageId !== null && (
            <EmojiSearchPicker
              onSelectEmoji={(emoji) => {
                handleToggleEmoji(activeFullPickerMessageId, emoji);
                setActiveFullPickerMessageId(null);
              }}
              onClose={() => setActiveFullPickerMessageId(null)}
            />
          )}

          {/* Chat input emoji picker overlay (renders in main content) */}
          {showChatEditorEmojiPicker && (
            <EmojiSearchPicker
              onSelectEmoji={(emoji) => {
                setMessageText((prev) => prev + emoji);
                setShowChatEditorEmojiPicker(false);
              }}
              onClose={() => setShowChatEditorEmojiPicker(false)}
            />
          )}

          {isJumpingToMessage && (
            <div className="absolute inset-0 bg-surface-950/45 backdrop-blur-xs flex items-center justify-center z-40 animate-fadeIn">
              <div className="flex flex-col items-center gap-3 p-4 bg-surface-900/90 border border-border rounded-2xl shadow-xl">
                <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <span className="text-xs font-semibold text-text-secondary">Loading message history...</span>
              </div>
            </div>
          )}

          <MessageStream
            messages={messages}
            messagesLoading={messagesLoading}
            typingUsers={typingUsers}
            currentUserId={currentUser?.id}
            activeChannelName={activeChannelData?.name}
            readReceipts={readReceipts}
            onReact={handleToggleEmoji}
            activePickerId={activeReactionPickerMessageId}
            setActivePickerId={setActiveReactionPickerMessageId}
            onOpenFullPicker={setActiveFullPickerMessageId}
            onLoadMore={loadMoreHistory}
            hasMore={hasMoreMessages}
            isFetchingMore={isFetchingMoreMessages}
            onReply={(msg) => setReplyingTo({ id: msg.id, author: msg.author, content: msg.content })}
            onDelete={canDeleteMessages && !activeChannelData?.is_protected ? handleDeleteClick : undefined}
            onEdit={
              activeChannelData?.grouping === "Welcome & Info" &&
              (currentUser?.role === "superadmin" ||
                currentUser?.permission_keys?.includes("modify_welcome_info_messages"))
                ? handleEditMessage
                : undefined
            }
            onToast={triggerToast}
            onJumpToMessage={jumpToMessage}
            onLoadNewer={loadNewerHistory}
            hasNewer={hasNewerMessages}
            isFetchingNewer={isFetchingNewerMessages}
            jumpToId={jumpToId}
            onJumpToIdCleared={() => setJumpToId(null)}
            onJumpToPresent={jumpToPresent}
          />
        </div>

        {hasNewerMessages && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border-t border-b border-amber-500/20 text-xs animate-fadeIn">
            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Viewing older messages history
            </span>
            <button
              onClick={jumpToPresent}
              className="text-primary hover:text-primary-light font-bold hover:underline cursor-pointer transition-colors"
            >
              Jump to Present
            </button>
          </div>
        )}

        <MessageInput
          messageText={messageText}
          placeholder={
            !activeChannelData
              ? "Connect to a channel..."
              : !hasWritePermission
                ? `Message #${activeChannelData.name} (Read-only)`
                : `Message #${activeChannelData.name}`
          }
          disabled={!activeChannel || !isConnected || !hasWritePermission}
          onSubmit={handleSendMessage}
          onChange={handleInputChange}
          hasWritePermission={!!hasWritePermission}
          onlineUsers={allUsers}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSelectGif={handleSelectGif}
          setMessageText={setMessageText}
          onOpenEmojiPicker={() => setShowChatEditorEmojiPicker(true)}
          isActivityLog={activeChannelData?.slug === 'activity-log'}
        />
      </div>

      {/* Members Sidebar Panel */}
      {showMembersList && (
        <div className="hidden md:flex w-60 flex-shrink-0 border-l border-border bg-surface-900/30 flex-col animate-slideLeft">
          <MembersList onlineUsers={onlineUsers as any} />
        </div>
      )}
    </div>
  );
}
