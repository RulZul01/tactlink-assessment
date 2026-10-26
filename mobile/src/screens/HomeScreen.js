import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  Share,
  Platform,
} from 'react-native';

export default function HomeScreen({ user, onLogout, fetchGraphQL }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Default');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [localCompletedMap, setLocalCompletedMap] = useState({});
  const [localPriorityMap, setLocalPriorityMap] = useState({});
  
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');

  const [toastMessage, setToastMessage] = useState('');
  const [showToastBanner, setShowToastBanner] = useState(false);
  
  const toastTranslateY = useRef(new Animated.Value(-40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg) => {
    setToastMessage(msg);
    setShowToastBanner(true);

    Animated.sequence([
      Animated.spring(toastTranslateY, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastTranslateY, { toValue: -40, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowToastBanner(false);
    });
  };

  const fetchTasks = async () => {
    try {
      const query = `
        query GetTodos($userId: ID!) {
          getTodos(userId: $userId) {
            id
            text
            completed
          }
        }
      `;
      const data = await fetchGraphQL(query, { userId: user.id });
      setTasks(data?.getTodos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTodo = async () => {
    if (!taskText.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const mutation = `
        mutation CreateTodo($userId: ID!, $text: String!) {
          createTodo(userId: $userId, text: $text) {
            id
            text
            completed
          }
        }
      `;
      const res = await fetchGraphQL(mutation, { userId: user.id, text: taskText });
      if (res?.createTodo?.id) {
        setLocalPriorityMap(prev => ({ ...prev, [res.createTodo.id]: priority }));
      }
      setTaskText('');
      await fetchTasks();
      showToast('Reminder added');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add task');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const mutation = `
        mutation DeleteTodo($id: ID!) {
          deleteTodo(id: $id)
        }
      `;
      await fetchGraphQL(mutation, { id });
      await fetchTasks();
      showToast('Reminder deleted');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not delete task');
    }
  };

  const handleSaveEdit = (id) => {
    if (!editText.trim()) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: editText } : t));
    setLocalPriorityMap(prev => ({ ...prev, [id]: editPriority }));
    setEditingId(null);
    setEditText('');
    showToast('Reminder updated');
  };

  const toggleComplete = (id) => {
    setLocalCompletedMap(prev => {
      const nextVal = prev[id] !== undefined ? !prev[id] : true;
      return { ...prev, [id]: nextVal };
    });
    showToast('Status updated');
  };

  const handleSelectAll = () => {
    const allDone = tasks.every(t => localCompletedMap[t.id] !== undefined ? localCompletedMap[t.id] : t.completed);
    const newMap = {};
    tasks.forEach(t => {
      newMap[t.id] = !allDone;
    });
    setLocalCompletedMap(newMap);
    showToast(allDone ? 'Marked incomplete' : 'Marked completed');
  };

  const handleExportJSON = async () => {
    const jsonString = JSON.stringify(tasks, null, 2);
    if (Platform.OS === 'web') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reminders_export.json';
      a.click();
      showToast('Exported to JSON');
    } else {
      try {
        await Share.share({ message: jsonString });
        showToast('Exported successfully');
      } catch (e) {
        Alert.alert('Export Error', e.message);
      }
    }
  };

  const processedTasks = tasks
    .filter(t => {
      const isDone = localCompletedMap[t.id] !== undefined ? localCompletedMap[t.id] : t.completed;
      if (filter === 'Active' && isDone) return false;
      if (filter === 'Completed' && !isDone) return false;
      if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Alphabetical') return a.text.localeCompare(b.text);
      if (sortBy === 'Priority') {
        const pA = localPriorityMap[a.id] || 'Medium';
        const pB = localPriorityMap[b.id] || 'Medium';
        const weight = { High: 3, Medium: 2, Low: 1 };
        return weight[pB] - weight[pA];
      }
      return 0;
    });

  const completedCount = tasks.filter(t => localCompletedMap[t.id] !== undefined ? localCompletedMap[t.id] : t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const interpolatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {showToastBanner && (
        <Animated.View style={[styles.safeToastContainer, { transform: [{ translateY: toastTranslateY }] }]}>
          <View style={styles.toastDot} />
          <Text style={styles.toastText} numberOfLines={1}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Header Area */}
      <View style={styles.headerArea}>
        <View>
          <Text style={[styles.largeTitle, isDarkMode && styles.darkText]}>Reminders</Text>
          <Text style={styles.accountText}>{user.email}</Text>
        </View>
        <View style={styles.headerActionGroup}>
          <TouchableOpacity style={[styles.pillBtn, isDarkMode && styles.darkCard]} onPress={() => setIsDarkMode(!isDarkMode)}>
            <Text style={{ fontSize: 11 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutPillBtn} onPress={onLogout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Card */}
      {tasks.length > 0 && (
        <View style={[styles.appleCard, isDarkMode && styles.darkCard]}>
          <View style={styles.progressRow}>
            <Text style={[styles.cardTitle, isDarkMode && styles.darkSubText]}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{progressPercent}%</Text>
          </View>
          <View style={[styles.progressTrack, isDarkMode && { backgroundColor: '#2c2c2e' }]}>
            <Animated.View style={[styles.progressBar, { width: interpolatedWidth }]} />
          </View>
        </View>
      )}

      {/* Input Box */}
      <View style={[styles.appleCard, styles.inputCardWrapper, isDarkMode && styles.darkCard]}>
        <TextInput
          style={[styles.quickInput, isDarkMode && styles.darkInputText]}
          placeholder="New Reminder..."
          placeholderTextColor={isDarkMode ? '#64748b' : '#a1a1aa'}
          value={taskText}
          onChangeText={setTaskText}
        />
        <View style={styles.quickAddFooter}>
          <View style={styles.priorityGroup}>
            {['High', 'Medium', 'Low'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityPill, priority === p && styles.priorityPillActive, isDarkMode && styles.darkPill]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityPillText, priority === p && styles.priorityPillTextActive, isDarkMode && priority !== p && { color: '#9a9a9e' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.addCircleBtn, !taskText.trim() && { opacity: 0.35 }]} onPress={handleAddTodo} disabled={!taskText.trim() || isAdding}>
            <Text style={styles.plusSign}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={[styles.segmentedControl, isDarkMode && styles.darkSegmentBg]}>
        {['All', 'Active', 'Completed'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.segmentTab, filter === tab && styles.segmentTabActive, isDarkMode && filter === tab && { backgroundColor: '#3a3a3c' }]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.segmentText, filter === tab && styles.segmentTextActive, isDarkMode && { color: filter === tab ? '#ffffff' : '#9a9a9e' }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search & Sort */}
      <View style={styles.searchSortRow}>
        <TextInput
          style={[styles.searchBox, isDarkMode && styles.darkCard, isDarkMode && styles.darkInputText]}
          placeholder="Search"
          placeholderTextColor={isDarkMode ? '#64748b' : '#a1a1aa'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[styles.sortButton, isDarkMode && styles.darkCard]} 
          onPress={() => {
            const next = sortBy === 'Default' ? 'Priority' : sortBy === 'Priority' ? 'Alphabetical' : 'Default';
            setSortBy(next);
            showToast(`Sorted by ${next}`);
          }}
        >
          <Text style={[styles.sortButtonText, isDarkMode && styles.darkText]}>Sort ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Link Bar */}
      <View style={styles.bulkRow}>
        <TouchableOpacity onPress={handleSelectAll}>
          <Text style={styles.bulkLink}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportJSON}>
          <Text style={styles.bulkLink}>Export JSON</Text>
        </TouchableOpacity>
      </View>

      {/* Grouped Table List */}
      <View style={[styles.appleCard, styles.listContainerCard, isDarkMode && styles.darkCard]}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#007aff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={processedTasks}
            keyExtractor={item => item.id}
            refreshing={loading}
            onRefresh={fetchTasks}
            ListEmptyComponent={() => (
              <View style={styles.centerBox}>
                <Text style={[styles.emptyTitle, isDarkMode && styles.darkText]}>No Reminders</Text>
                <Text style={styles.emptySubtitle}>You're all caught up!</Text>
              </View>
            )}
            renderItem={({ item, index }) => {
              const isDone = localCompletedMap[item.id] !== undefined ? localCompletedMap[item.id] : item.completed;
              const taskPriority = localPriorityMap[item.id] || 'Medium';
              const priorityDotColor = taskPriority === 'High' ? '#ff3b30' : taskPriority === 'Medium' ? '#ff9500' : '#007aff';
              const isEditing = editingId === item.id;

              return (
                <View style={[styles.taskRowCell, index > 0 && styles.rowSeparator, isDarkMode && styles.darkSeparator]}>
                  <TouchableOpacity style={styles.rowLeft} onPress={() => toggleComplete(item.id)}>
                    <View style={[styles.iosCheckbox, isDone && styles.iosCheckboxChecked, isDarkMode && { borderColor: '#3a3a3c' }]}>
                      {isDone && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    {isEditing ? (
                      <View style={{ gap: 6, marginVertical: 4 }}>
                        <TextInput
                          style={[styles.inlineEditInput, isDarkMode && styles.darkInputText]}
                          value={editText}
                          onChangeText={setEditText}
                          autoFocus
                        />
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {['High', 'Medium', 'Low'].map(p => (
                            <TouchableOpacity
                              key={p}
                              style={[styles.editPill, editPriority === p && styles.editPillActive, isDarkMode && styles.darkPill]}
                              onPress={() => setEditPriority(p)}
                            >
                              <Text style={[styles.editPillText, editPriority === p && styles.editPillTextActive, isDarkMode && editPriority !== p && { color: '#9a9a9e' }]}>{p}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.taskTextContent}>
                        <Text style={[styles.taskTitleText, isDone && styles.taskTextStrikethrough, isDarkMode && styles.darkText]}>
                          {item.text}
                        </Text>
                        <View style={styles.metaRow}>
                          <View style={[styles.priorityDot, { backgroundColor: priorityDotColor }]} />
                          <Text style={styles.priorityLabelText}>{taskPriority}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.rowRightActions}>
                    {isEditing ? (
                      <TouchableOpacity style={styles.actionTextBtn} onPress={() => handleSaveEdit(item.id)}>
                        <Text style={styles.blueActionText}>Done</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.actionTextBtn} onPress={() => { setEditingId(item.id); setEditText(item.text); setEditPriority(taskPriority); }}>
                        <Text style={styles.grayActionText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionTextBtn} onPress={() => handleDelete(item.id)}>
                      <Text style={styles.redActionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 16,
    paddingTop: 48,
    position: 'relative',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  safeToastContainer: {
    position: 'absolute',
    top: 44,
    alignSelf: 'center',
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 6,
    width: 96, 
    height: 26,
    borderRadius: 14,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  toastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c759',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: -0.2,
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  largeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.4,
  },
  accountText: {
    fontSize: 9,
    color: '#8e8e93',
    fontWeight: '500',
    marginTop: 1,
  },
  darkText: {
    color: '#f8fafc',
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  signOutPillBtn: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  signOutText: {
    color: '#ff3b30',
    fontSize: 10,
    fontWeight: '600',
  },
  appleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  darkCard: {
    backgroundColor: '#1c1c1e',
    borderColor: '#2c2c2e',
  },
  darkSubText: {
    color: '#aeaeb2',
  },
  darkInputText: {
    color: '#ffffff',
    ...(Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }),
  },
  darkPill: {
    backgroundColor: '#2c2c2e',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34c759',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#e5e5ea',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34c759',
    borderRadius: 3,
  },
  inputCardWrapper: {
    paddingVertical: 10,
  },
  quickInput: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 6,
    padding: 0,
    ...(Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }),
  },
  quickAddFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#f2f2f7',
  },
  priorityPillActive: {
    backgroundColor: '#007aff',
  },
  priorityPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },
  priorityPillTextActive: {
    color: '#ffffff',
  },
  addCircleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusSign: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: -1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#e3e3e8',
    borderRadius: 9,
    padding: 2,
    marginBottom: 8,
  },
  darkSegmentBg: {
    backgroundColor: '#1c1c1e',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3a3a3c',
  },
  segmentTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  searchSortRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: '#000000',
    ...(Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }),
  },
  sortButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007aff',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  bulkLink: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007aff',
  },
  listContainerCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    marginBottom: 8,
  },
  centerBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 4,
    fontSize: 10,
    color: '#8e8e93',
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  emptySubtitle: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2,
  },
  taskRowCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rowSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c6c6c8',
  },
  darkSeparator: {
    borderTopColor: '#2c2c2e',
  },
  rowLeft: {
    marginRight: 10,
  },
  iosCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: '#c6c6c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iosCheckboxChecked: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  taskTextContent: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
  },
  taskTextStrikethrough: {
    textDecorationLine: 'line-through',
    color: '#8e8e93',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityLabelText: {
    fontSize: 8,
    color: '#8e8e93',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  rowRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTextBtn: {
    paddingVertical: 2,
  },
  blueActionText: {
    color: '#007aff',
    fontSize: 10,
    fontWeight: '600',
  },
  grayActionText: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '500',
  },
  redActionText: {
    color: '#ff3b30',
    fontSize: 10,
    fontWeight: '500',
  },
  inlineEditInput: {
    borderWidth: 1,
    borderColor: '#007aff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 11,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }),
  },
  editPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#f2f2f7',
  },
  editPillActive: {
    backgroundColor: '#007aff',
  },
  editPillText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#8e8e93',
  },
  editPillTextActive: {
    color: '#ffffff',
  },
});