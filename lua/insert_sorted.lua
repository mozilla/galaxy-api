local key = KEYS[1]
local member = ARGV[2]
local score = ARGV[1]

local count = redis.call("ZCARD", key)
local curPosition = redis.call("ZSCORE", key, member)

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
