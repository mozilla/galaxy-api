local key = KEYS[1]
local member = ARGV[1]
local score = ARGV[2]

local count = redis.call("ZCARD", key)
local curPosition = redis.call("ZSCORE", key, member)

-- if no position is given
if ((score + 1) == 0) then
  if (curPosition ~= false) then
    return 0
  else
    score = count + 1
  end
end

-- if game is not yet featured
if curPosition == false then
  local items = redis.call("ZRANGEBYSCORE", key, score, count)
  for i, item in ipairs(items) do
    redis.call("ZINCRBY", key, 1, item)
  end
  return redis.call("ZADD", key, score, member)

-- if game is already featured
else
  if curPosition > score then
    local items = redis.call("ZRANGEBYSCORE", key, score, curPosition - 1)
    for i, item in ipairs(items) do
      redis.call("ZINCRBY", key, 1, item)
    end
  elseif curPosition < score then
    local items = redis.call("ZRANGEBYSCORE", key, curPosition + 1, score)
    for i, item in ipairs(items) do
      redis.call("ZINCRBY", key, -1, item)
    end
  end
  return redis.call("ZINCRBY", key, score - curPosition, member)
end
